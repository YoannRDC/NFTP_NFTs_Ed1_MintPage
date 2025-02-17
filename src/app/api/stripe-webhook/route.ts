// src/app/api/stripe-webhook/route.ts

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  // Validate the webhook signature
  // Source: https://stripe.com/docs/webhooks#secure-webhook
  const body = await req.text();
  const strip_signature = req.headers.get("stripe-signature");
  
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
      const { buyerWalletAddress } = event.data.object.metadata;
      console.log("buyerWalletAddress:", buyerWalletAddress);
      console.log("Mint in progress ...");
    }
    
    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
  
}
