import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { 
  extractPaymentMetadataStripe,
  PaymentMetadata,
} from "../PaymentMetadata";
import { distributeNFT } from "../ApiRequestDistribution";
import { assertValidityStripe, initializeThirdwebClient } from "../ApiCommons";

export async function POST(req: NextRequest) {
  // Vérification et extraction de l'événement Stripe
  const result = await assertValidityStripe(req);
  if (result instanceof NextResponse) {
    return result;  // Erreur lors de la validation
  }
  
  const stripeEvent = result as Stripe.Event;

  // Traitement uniquement pour certains types d'événements (ici "charge.succeeded")
  if (stripeEvent.type === "charge.succeeded") {
    const paymentIntent = stripeEvent.data.object as any;
    const metadataOrError = extractPaymentMetadataStripe(paymentIntent);
    // Si une erreur survient dans l'extraction des métadonnées, on renvoie la réponse d'erreur directement
    if (metadataOrError instanceof NextResponse) {
      return metadataOrError;
    }
    const paymentMetadata: PaymentMetadata = metadataOrError;

    const client = initializeThirdwebClient();
    if (client instanceof NextResponse) {
      return metadataOrError;
    }

    // On lance la distribution du NFT (attention à gérer le cas asynchrone et les erreurs potentielles)
    const safeResult = await distributeNFT(client, paymentMetadata);
    console.log("Transaction result:", safeResult);
  }

  return NextResponse.json({ message: "OK" });
}
