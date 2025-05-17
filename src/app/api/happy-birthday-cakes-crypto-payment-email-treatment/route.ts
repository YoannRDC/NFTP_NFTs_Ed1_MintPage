import { NextResponse } from "next/server";
import { createNFTtxInBDD, NFTtxRecord, sendDownloadEmail, updateNFTtxStatus } from "../ApiEmailCodes";
import { TransactionStatus } from "@/app/constants";

export async function POST(req: Request) {
  try {
    const { email, tokenId, offererName, txResult } = await req.json();

    console.log("→ Received TX:", {
      email, tokenId, offererName, txResult
    });

    const paymentTxHash = txResult.hash;
    const txStatus = txResult.status;

    if (!paymentTxHash || !txStatus || !["confirmed", "pending"].includes(txStatus)) {
      return NextResponse.json({ error: "txResult invalide" }, { status: 400 });
    }

    if (txStatus === "confirmed") {

      const NFTtxRecord: NFTtxRecord = await createNFTtxInBDD(
        txResult.hash,
        email,
        tokenId,
        offererName,
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
      // txStatus === "pending"
      await createNFTtxInBDD(paymentTxHash, email, tokenId, offererName, TransactionStatus.TX_PENDING);
      return NextResponse.json({
        success: false,
        error: `La transaction est encore en cours. Utilisez le formulaire en bas de page avec le hash: ${paymentTxHash} pour demander le renvoie de l'email`
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
