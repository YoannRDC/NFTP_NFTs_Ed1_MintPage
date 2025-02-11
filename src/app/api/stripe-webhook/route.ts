// src/app/api/stripe-webhook/route.ts

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  // Validate the webhook signature
  // Source: https://stripe.com/docs/webhooks#secure-webhook
  const body = await req.text();
  const strip_signature = headers().get("stripe-signature");

  if (!strip_signature) {
    console.log("invalid stripe-signature");
    return;
  }

  const stripe = new Stripe("<stripe_secret_key>", {
    apiVersion: "2025-01-27.acacia",
  });

  // Validate and parse the payload.
  const event = stripe.webhooks.constructEvent(
    body,
    strip_signature,
    process.env.STRIPE_WEBHOOK_SECRET as string,
  );

  if (event.type === "charge.succeeded") {
    const { buyerWalletAddress } = event.data.object.metadata;

    // TODO: Mint the NFT to the buyer with Engine here !!
  }

  return NextResponse.json({ message: "OK" });
}
