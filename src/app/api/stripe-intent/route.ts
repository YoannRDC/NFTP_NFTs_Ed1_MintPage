import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const {
    buyerWalletAddress,
    nftContractAddress,
    blockchainId,
    requestedQuantity,
    amount,
    stripeMode, // "test" ou "live"
  } = await req.json();

  // Sélection de la clé Stripe en fonction du mode demandé
  const stripeSecretKey =
    stripeMode === "live"
      ? process.env.STRIPE_SECRET_KEY_LIVE
      : process.env.STRIPE_SECRET_KEY_TEST;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "La clé secrète Stripe n'est pas définie" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-01-27.acacia",
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount, // montant en centimes
    currency: "eur",
    payment_method_types: ["card"],
    metadata: {
      buyerWalletAddress,
      nftContractAddress,
      blockchainId,
      requestedQuantity,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
