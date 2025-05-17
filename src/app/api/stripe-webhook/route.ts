import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { 
  extractPaymentMetadataStripe,
  PaymentMetadata,
} from "../PaymentMetadata";
import { distributeNFT } from "../ApiRequestDistribution";
import { assertValidityStripe, initializeThirdwebClient } from "../ApiPaymentReception";
import { DistributionType, TransactionStatus } from "@/app/constants";
import { createNFTtxInBDD, NFTtxRecord, sendDownloadEmail, updateNFTtxStatus } from "../ApiEmailCodes";

export async function POST(req: NextRequest) {

  console.log("stripe-webhook starts ...")
  // Vérification et extraction de l'événement Stripe
  const result = await assertValidityStripe(req);
  if (result instanceof NextResponse) {
    return result;  // Erreur lors de la validation
  }
  
  const stripeEvent = result as Stripe.Event;

  // Traitement uniquement pour certains types d'événements (ici "charge.succeeded")
  if (stripeEvent.type === "charge.succeeded") {
    console.log("stripe-webhook charge.succeeded ...")
    const paymentIntent = stripeEvent.data.object as any;
    const metadataOrError = extractPaymentMetadataStripe(paymentIntent);
    // Si une erreur survient dans l'extraction des métadonnées, on renvoie la réponse d'erreur directement
    if (metadataOrError instanceof NextResponse) {
      return metadataOrError;
    }
    const paymentMetadata: PaymentMetadata = metadataOrError;

    const client = initializeThirdwebClient();
    if (client instanceof NextResponse) {
      return client;
    }
    console.log("stripe-webhook initializeThirdwebClient done ...")

    if (paymentMetadata.distributionType === DistributionType.EmailCode) {

      if (!paymentMetadata.paymentTxRefStripe) {
        throw new Error("paymentTxRefStripe est requis pour enregistrer le cadeau.");
      }

      const NFTtxRecord: NFTtxRecord = await createNFTtxInBDD(
        paymentMetadata.paymentTxRefStripe,
        paymentMetadata.recipientWalletAddressOrEmail,
        paymentMetadata.tokenId,
        paymentMetadata.offererName!,
        TransactionStatus.TX_CONFIRMED
      );

      console.log("stripe-webhook DistributionType.EmailCode ...")
      const sendMailRes = await sendDownloadEmail(NFTtxRecord);

      if (sendMailRes === "ok") {
        await updateNFTtxStatus(NFTtxRecord.txHashRef, TransactionStatus.EMAIL_SENT);
        return NextResponse.json({ success: true });
      } else {
        await updateNFTtxStatus(NFTtxRecord.txHashRef, TransactionStatus.EMAIL_FAILED);
        return NextResponse.json(
          { error: `L'envoi de l'email a échoué. Contactez le support avec la référence Tx hash: ${NFTtxRecord.txHashRef}` },
          { status: 500 }
        );
      }
    } else {
        // On lance la distribution du NFT (attention à gérer le cas asynchrone et les erreurs potentielles)
        const safeResult = await distributeNFT(client, paymentMetadata);
        console.log("Transaction result:", safeResult);
      }

    return NextResponse.json({ message: "OK" });
  }
  return NextResponse.json({ message: "Stripe paiement failed" });
}
