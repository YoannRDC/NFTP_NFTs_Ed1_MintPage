import { NextResponse } from "next/server";
import { createGiftInBDD, GiftRecord, sendDownloadEmail, updateGiftStatus } from "../ApiEmailCodes";
import { TransactionStatus } from "@/app/constants";

export async function POST(req: Request) {
  try {
    const { email, tokenId, offererName, txResult } = await req.json();

    console.log("→ Received TX:", {
      email, tokenId, offererName, txResult
    });

    const txHash = txResult.hash;
    const txStatus = txResult.status;

    if (!txHash || !txStatus || !["confirmed", "pending"].includes(txStatus)) {
      return NextResponse.json({ error: "txResult invalide" }, { status: 400 });
    }

    if (txStatus === "confirmed") {

      const giftRecord: GiftRecord = await createGiftInBDD(
        txResult.hash,
        email,
        tokenId,
        offererName,
        TransactionStatus.TX_CONFIRMED
      );

      console.log("stripe-webhook DistributionType.EmailCode ...")
      const sendMailRes = await sendDownloadEmail(giftRecord);

      if (sendMailRes === "ok") {
        await updateGiftStatus(giftRecord.txHashRef, TransactionStatus.EMAIL_SENT);
        return NextResponse.json({ success: true });
      } else {
        await updateGiftStatus(giftRecord.txHashRef, TransactionStatus.EMAIL_FAILED);
        return NextResponse.json(
          { error: `L'envoi de l'email a échoué. Contactez le support avec la référence Tx hash: ${giftRecord.txHashRef}` },
          { status: 500 }
        );
      }
    } else {
      // txStatus === "pending"
      await createGiftInBDD(txHash, email, tokenId, offererName, TransactionStatus.TX_PENDING);
      return NextResponse.json({
        success: false,
        error: `La transaction est encore en cours. Utilisez le formulaire en bas de page avec le hash: ${txHash} pour demander le renvoie de l'email`
      });
    }

  } catch (err: any) {
    console.error("[API ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
