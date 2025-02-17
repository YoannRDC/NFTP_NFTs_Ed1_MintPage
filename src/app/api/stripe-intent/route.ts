import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const { buyerWalletAddress, nftContract } = await req.json();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST as string, {
    apiVersion: "2025-01-27.acacia",
  });
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 500, // 500 centimes = 5€
    currency: "eur",
    payment_method_types: ["card"],
    metadata: {
      buyerWalletAddress,
      nftContractAddress: nftContract
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
