import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { claimTo } from "thirdweb/extensions/erc721";
import { createThirdwebClient, defineChain, getContract, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { minterAddress } from "@/app/constants";

// -----------------------------------------------------------------------------
// TODO: BDD Needed: Idempotence (exemple en mémoire – à remplacer par une solution persistante en prod)
const processedEvents = new Set<string>();

function hasEventBeenProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

function markEventAsProcessed(eventId: string): void {
  processedEvents.add(eventId);
}

// -----------------------------------------------------------------------------
// Validation des adresses Ethereum (format 0x suivi de 40 caractères hexadécimaux)
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// -----------------------------------------------------------------------------
// Fonction de masquage de la clé secrète
const maskSecretKey = (secretKey: string): string => {
  if (secretKey.length <= 8) return secretKey;
  return secretKey.slice(0, 4) + "..." + secretKey.slice(-4);
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const stripeSignature = req.headers.get("stripe-signature");

  console.log("Webhook called");

  if (!stripeSignature) {
    console.error("Missing stripe-signature");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  // Vérifier que les variables d'environnement Stripe existent
  if (!process.env.STRIPE_SECRET_KEY_TEST || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing Stripe configuration");
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
    apiVersion: "2025-01-27.acacia",
  });

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Vérification d'idempotence
    if (hasEventBeenProcessed(event.id)) {
      console.log(`Event ${event.id} has already been processed.`);
      return NextResponse.json({ message: "Event already processed" });
    }

    if (event.type === "charge.succeeded") {
      console.log("###############");
      console.log("New Customer");
      const paymentIntent = event.data.object as any;

      const buyerWalletAddress = paymentIntent.metadata.buyerWalletAddress;
      const nftContractAddress = paymentIntent.metadata.nftContractAddress;
      const blockchainId = paymentIntent.metadata.blockchainId;
      const requestedQuantity = paymentIntent.metadata.requestedQuantity;
      console.log("buyerWalletAddress:", buyerWalletAddress);
      console.log("nftContractAddress:", nftContractAddress);
      console.log("blockchainId:", blockchainId);
      console.log("requestedQuantity:", requestedQuantity);

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
      console.log("client.clientId:", client.clientId);

      const nftContract = getContract({
        client,
        chain: defineChain(Number(blockchainId)),
        address: nftContractAddress,
      });
      console.log("nftContract.address:", nftContract.address);

      const transaction = claimTo({
        contract: nftContract,
        to: buyerWalletAddress,
        quantity: BigInt(requestedQuantity),
        from: minterAddress, // adresse de celui qui effectue la réclamation
      });
      console.log("transaction:", transaction);

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

      // Masquer partiellement la clé secrète dans le log
      const safeResult = {
        ...result,
        client: {
          ...result.client,
          secretKey: maskSecretKey(result.client.secretKey!)
        }
      };
      console.log("Transaction result:", safeResult);
    }

    // Marquer l'événement comme traité pour éviter les traitements multiples
    markEventAsProcessed(event.id);

    // TODO: Transfer tous les logs VERCEL vers un serveur pour qu'ils soient sauvegardés 

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
