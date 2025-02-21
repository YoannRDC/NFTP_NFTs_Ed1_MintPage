// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ethers } from "ethers";
import contractABI from "../../../../contracts/contract_NFTP_ed1_ABI.json";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const stripeSignature = req.headers.get("stripe-signature");

  console.log("Webhook called");

  if (!stripeSignature) {
    console.log("invalid stripe-signature");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST as string, {
    apiVersion: "2025-01-27.acacia",
  });

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (event.type === "charge.succeeded") {
      const paymentIntent = event.data.object as any;
      const buyerWalletAddress = paymentIntent.metadata.buyerWalletAddress;
      console.log("buyerWalletAddress:", buyerWalletAddress);

      const nftContractAddress = paymentIntent.metadata.nftContractAddress;
      console.log("nftContractAddress:", nftContractAddress);

      console.log(" > charge.succeeded");

      if (!process.env.PRIVATE_KEY_MINTER) {
        console.log("missing PRIVATE_KEY_MINTER");
        return NextResponse.json({ error: "missing PRIVATE_KEY_MINTER" }, { status: 400 });
      }

      console.log(" > PRIVATE_KEY_MINTER -> OK");

      try {

        // instantiate the SDK based on your private key, with the desired chain to connect to
        const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY_MINTER, "polygon");

        // Récupérer l'instance du contrat NFT Drop via le SDK
        const nftDrop = sdk.getContract(nftContractAddress, "nft-drop");
        console.log("Instance du contrat récupérée:", nftDrop);

        // Appeler la fonction claimTo pour réclamer 1 NFT au portefeuille de l'acheteur
        const tx = await (await nftDrop).claimTo(buyerWalletAddress, 1);
        console.log("Claim réussi. Transaction :", tx);
      
      } catch (error) {
        console.error("Erreur lors du claim:", error);
        return NextResponse.json({ message: "Erreur lors de l'exécution du claim" }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
