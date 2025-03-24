import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { claimTo as claimToERC721 } from "thirdweb/extensions/erc721";
import { claimTo as claimToERC1155 } from "thirdweb/extensions/erc1155";
import { createThirdwebClient, defineChain, getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { minterAddress, nftpPubKey } from "@/app/constants";

// ----------------------------------------------------------------------------
// Exemple d'implémentation d'idempotence (à remplacer en prod par une solution persistante)
const processedEvents = new Set<string>();

function hasEventBeenProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

function markEventAsProcessed(eventId: string): void {
  processedEvents.add(eventId);
}

// ----------------------------------------------------------------------------
// Validation des adresses Ethereum
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// ----------------------------------------------------------------------------
// Fonction de masquage de la clé secrète
const maskSecretKey = (secretKey: string): string => {
  if (secretKey.length <= 8) return secretKey;
  return secretKey.slice(0, 4) + "..." + secretKey.slice(-4);
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const stripeSignature = req.headers.get("stripe-signature");

  console.log("Webhook called");

  if (!stripeSignature) {
    console.error("Missing stripe-signature");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY_TEST || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing Stripe configuration");
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
    apiVersion: "2025-02-24.acacia",
  });

  try {
    const buf = Buffer.from(rawBody, "utf8");
    const event = stripe.webhooks.constructEvent(
      buf,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Vérification d'idempotence
    if (hasEventBeenProcessed(event.id)) {
      console.warn(`Event ${event.id} has already been processed.`);
      return NextResponse.json({ message: "Event already processed" });
    }

    if (event.type === "charge.succeeded") {
      console.log("###############");
      console.log("New Customer");
      const paymentIntent = event.data.object as any;

      // Extraction des données depuis les metadata Stripe
      const buyerWalletAddress = paymentIntent.metadata.buyerWalletAddress;
      const nftContractAddress = paymentIntent.metadata.nftContractAddress;
      const blockchainId = paymentIntent.metadata.blockchainId;
      const requestedQuantity = paymentIntent.metadata.requestedQuantity; // en string
      const contractType = paymentIntent.metadata.contractType; // "erc721drop" | "erc1155drop" | "erc721transfert"
      const tokenId = paymentIntent.metadata.tokenId; 

      console.log("buyerWalletAddress:", buyerWalletAddress);
      console.log("nftContractAddress:", nftContractAddress);
      console.log("blockchainId:", blockchainId);
      console.log("requestedQuantity:", requestedQuantity);
      console.log("contractType:", contractType);
      console.log("paymentIntent.metadata:", paymentIntent.metadata);

      // Validation des adresses Ethereum
      if (!isValidEthereumAddress(buyerWalletAddress)) {
        console.error("Invalid buyer wallet address");
        return NextResponse.json({ error: "Invalid buyer wallet address" }, { status: 400 });
      }
      if (!isValidEthereumAddress(nftContractAddress)) {
        console.error("Invalid NFT contract address");
        return NextResponse.json({ error: "Invalid NFT contract address" }, { status: 400 });
      }

      if (!process.env.THIRDWEB_API_SECRET_KEY) {
        console.error("Missing THIRDWEB_API_SECRET_KEY");
        return NextResponse.json({ error: "Missing THIRDWEB_API_SECRET_KEY" }, { status: 400 });
      }

      const client = createThirdwebClient({
        secretKey: process.env.THIRDWEB_API_SECRET_KEY,
      });
      console.log("Minter (AuthentArt):", client.clientId);

      const nftContract = getContract({
        client,
        chain: defineChain(Number(blockchainId)),
        address: nftContractAddress,
      });

      let transaction;
      if (contractType === "erc1155drop") {
        // Appel de claimTo de la librairie ERC1155
        console.log("contract:", contractType, ", to:", buyerWalletAddress, ", quantity:", BigInt(requestedQuantity) ,", tokenId:", tokenId);
        transaction = claimToERC1155({
          contract: nftContract,
          to: buyerWalletAddress,
          quantity: BigInt(requestedQuantity),
          from: minterAddress,
          tokenId: tokenId
        });

      } else if (contractType === "erc721drop") {
        console.log("contract:", contractType, ", to:", buyerWalletAddress, ", quantity:", BigInt(requestedQuantity));
        // Appel de claimTo de la librairie ERC721
        transaction = claimToERC721({
          contract: nftContract,
          to: buyerWalletAddress,
          quantity: BigInt(requestedQuantity),
          from: minterAddress,
        });
      } else if (contractType === "erc721transfert") {
        console.log("contract:", contractType, ", to:", buyerWalletAddress, ", quantity:", BigInt(requestedQuantity));
        // Appel de transfetTo de la librairie ERC721
        transaction = prepareContractCall({
          contract: nftContract,
          method:
            "function safeTransferFrom(address from, address to, uint256 tokenId)",
          params: [minterAddress, buyerWalletAddress, tokenId],
        });
      } else {
        console.error("Unknown contract type");
        return NextResponse.json({ error: "Unknown contract type" }, { status: 400 });
      }

      if (!process.env.PRIVATE_KEY_MINTER) {
        console.error("Missing PRIVATE_KEY_MINTER");
        return NextResponse.json({ error: "Missing PRIVATE_KEY_MINTER" }, { status: 400 });
      }
      console.log("Valid environment variables");

      const account = privateKeyToAccount({
        client,
        privateKey: process.env.PRIVATE_KEY_MINTER,
      });
      console.log("account.address:", account.address);

      const result = await sendTransaction({
        transaction,
        account,
      });

      const safeResult = {
        ...result,
        client: {
          ...result.client,
          secretKey: maskSecretKey(result.client.secretKey!),
        },
      };
      console.log("Transaction result:", safeResult);
    }

    markEventAsProcessed(event.id);

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
