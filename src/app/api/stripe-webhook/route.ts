import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { claimTo } from "thirdweb/extensions/erc721";
import { safeTransferFrom } from "thirdweb/extensions/erc1155";
import { createThirdwebClient, defineChain, getContract, sendTransaction } from "thirdweb";
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
      const contractType = paymentIntent.metadata.contractType; // "erc721drop" | "erc721collection" | "erc1155drop" | "erc1155edition"
      const tokenIdMetadata = paymentIntent.metadata.tokenId; 

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
      if (contractType === "erc1155drop" || contractType === "erc1155edition") {
        if (!tokenIdMetadata) {
          console.error("Missing tokenId for ERC1155 contract");
          return NextResponse.json({ error: "Missing tokenId for ERC1155 contract" }, { status: 400 });
        }
        console.log("paymentIntent.metadata.tokenId:", paymentIntent.metadata.tokenId);
        transaction = safeTransferFrom({
          contract: nftContract,
          from: nftpPubKey, // Adresse détentrice des NFT pré-mintés pour ERC1155
          to: buyerWalletAddress,
          tokenId: BigInt(tokenIdMetadata),
          value: BigInt(requestedQuantity),
          data: "0x",
          // Pas d'envoi de valeur en ETH, le paiement ayant déjà eu lieu via Stripe
        });
      } else if (contractType === "erc721drop" || contractType === "erc721collection") {
        transaction = claimTo({
          contract: nftContract,
          to: buyerWalletAddress,
          quantity: BigInt(requestedQuantity),
          from: minterAddress, // Adresse qui effectue la réclamation pour ERC721
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
