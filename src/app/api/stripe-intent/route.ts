import { NextResponse } from "next/server";
import Stripe from "stripe"; // ✅ Import correct de Stripe

// Initialisation de Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: Request) {
  try {
    const { buyerWalletAddress } = await req.json();

	   
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // Montant en centimes (ex: 10 EUR)
      currency: "eur",
      metadata: { buyerWalletAddress },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur Stripe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
