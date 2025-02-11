// src/app/api/stripe-intent/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const { buyerWalletAddress } = await req.json();

  const stripe = new Stripe(process.env.STRIPE_WEBHOOK_SECRET as string, {
    apiVersion: "2025-01-27.acacia",
  });
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 100_00,
    currency: "usd",
    payment_method_types: ["card"],
    // buyerWalletAddress is needed in the webhook.
    metadata: { buyerWalletAddress },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
