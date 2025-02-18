// src/app/api/stripe-webhook/route.ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ethers } from "ethers";

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

      const POLYGON_RPC_URL = `https://137.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`;
      console.log("POLYGON_RPC_URL:", POLYGON_RPC_URL);
      const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY_MINTER as string, provider);

      // Initialiser le SDK avec le signer pour permettre de signer la transaction
      const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.PRIVATE_KEY_MINTER as string,
        "polygon",
        { secretKey: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID }
      );      

      const contract = await sdk.getContract(nftContractAddress);
      const tx = await contract.erc721.claimTo(buyerWalletAddress, 1);
      console.log("NFT claimed successfully:", tx);
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
