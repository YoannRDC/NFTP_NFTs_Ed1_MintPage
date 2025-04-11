import { StripeMode } from "@/app/constants";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const {
    projectName,
    distributionType,
    buyerWalletAddress,
    recipientWalletAddress,
    nftContractAddress,
    blockchainId,
    tokenId,
    requestedQuantity,
    paymentPriceFiat,
    stripeMode,
  } = await req.json();

  console.log("projectName:", projectName);
  console.log("distributionType:", distributionType);
  console.log("buyerWalletAddress:", buyerWalletAddress);
  console.log("recipientWalletAddress:", recipientWalletAddress);
  console.log("nftContractAddress:", nftContractAddress);
  console.log("blockchainId:", blockchainId);
  console.log("tokenId:", tokenId);
  console.log("requestedQuantity:", requestedQuantity);
  console.log("paymentPriceFiat:", paymentPriceFiat);
  console.log("stripeMode:", stripeMode);

  // Sélection de la clé Stripe en fonction du mode demandé
  const stripeSecretKey =
    stripeMode === StripeMode.Live
      ? process.env.STRIPE_SECRET_KEY_LIVE
      : process.env.STRIPE_SECRET_KEY_TEST;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "La clé secrète Stripe n'est pas définie" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentPriceFiat, // montant en centimes
    currency: "eur",
    payment_method_types: ["card"],
    metadata: {
      projectName,
      distributionType, 
      buyerWalletAddress,
      recipientWalletAddress,
      nftContractAddress,
      blockchainId,
      tokenId, 
      requestedQuantity,
      paymentPriceFiat,
      stripeMode
    },
  });

  console.log("paymentIntent: ", paymentIntent)

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
