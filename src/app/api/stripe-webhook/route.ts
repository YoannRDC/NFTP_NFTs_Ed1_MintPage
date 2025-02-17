// src/app/api/stripe-webhook/route.ts

import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { claimTo } from "thirdweb/extensions/erc721";
import { useSendTransaction } from "thirdweb/react";

export async function POST(req: NextRequest) {
  // Validate the webhook signature
  // Source: https://stripe.com/docs/webhooks#secure-webhook
  const body = await req.text();
  const strip_signature = req.headers.get("stripe-signature");
  const { mutate: sendTransaction } = useSendTransaction();
  
  console.log("Webhook called");

  if (!strip_signature) {
    console.log("invalid stripe-signature");
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST as string, {
    apiVersion: "2025-01-27.acacia",
  });

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      strip_signature!,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    
    if (event.type === "charge.succeeded") {
      const paymentIntent = event.data.object as any;
      const buyerWalletAddress = paymentIntent.metadata.buyerWalletAddress;
      console.log("buyerWalletAddress:", buyerWalletAddress);
      
      const nftContractAddress = paymentIntent.metadata.nftContractAddress;
      console.log("nftContractAddress:", nftContractAddress);

      /* // Nort working: Must be called on the client side.
      const transaction = claimTo({
        contract:nftContractAddress,
        to: buyerWalletAddress,
        quantity: 1n,
      });
      sendTransaction(transaction); */

      // Initialize Thirdweb SDK for Polygon Mainnet using your API key.
      const sdk = new ThirdwebSDK("polygon", {
        // This API key is assumed to be set as an environment variable
        clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID,
      });

      // Get the NFT contract instance
      const contract = await sdk.getContract(nftContractAddress);

      // Claim the NFT by sending the transaction to claim 1 token to the buyer's wallet.
      // Depending on your contract setup, you might use either `claim` or `claimTo`.
      // Here we use `claimTo` for clarity.
      const tx = await contract.erc721.claimTo(buyerWalletAddress, 1);
      console.log("NFT claimed successfully:", tx);

    }   
    
    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
  
}
