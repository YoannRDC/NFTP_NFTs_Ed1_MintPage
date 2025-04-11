import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createThirdwebClient, defineChain, getContract } from "thirdweb";

export async function assertValidityStripe(req: NextRequest): Promise<Stripe.Event | NextResponse> {
  const rawBody = await req.text();
  const stripeSignature = req.headers.get("stripe-signature");

  if (!stripeSignature) {
    console.error("Missing stripe-signature");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error("Invalid JSON in webhook payload", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isLive = payload.livemode === true;
  const stripeSecretKey = isLive
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;
  const stripeWebhookSecret = isLive
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;

  if (!stripeSecretKey || !stripeWebhookSecret) {
    console.error("Missing Stripe configuration");
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  let event: Stripe.Event;
  try {
    const buf = Buffer.from(rawBody, "utf8");
    event = stripe.webhooks.constructEvent(buf, stripeSignature, stripeWebhookSecret);
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
  return event;
}

/**
 * Récupère le contrat NFT à partir du client, du blockchainId et de l'adresse du contrat.
 * @param client L'instance du client Thirdweb.
 * @param blockchainId L'identifiant de la chaîne (en nombre).
 * @param nftContractAddress L'adresse du contrat NFT.
 * @returns L'instance du contrat NFT.
 */
export const getNftContract = (
  client: ReturnType<typeof createThirdwebClient>,
  blockchainId: number,
  nftContractAddress: string
) => {
  return getContract({
    client,
    chain: defineChain(blockchainId),
    address: nftContractAddress,
  });
};

/**
 * Masque une clé secrète pour l'affichage en ne montrant que les 4 premiers et 4 derniers caractères.
 * @param secretKey La clé secrète à masquer.
 * @returns La clé masquée.
 */
export const maskSecretKey = (secretKey: string): string => {
  if (secretKey.length <= 8) return secretKey;
  return secretKey.slice(0, 4) + "..." + secretKey.slice(-4);
};

export function initializeThirdwebClient() {

    if (!process.env.THIRDWEB_API_SECRET_KEY) {
      return NextResponse.json({ error: "THIRDWEB_API_SECRET_KEY manquant" }, { status: 500 });
    }

    return createThirdwebClient({
      secretKey: process.env.THIRDWEB_API_SECRET_KEY,
    });
}

