import { NextRequest, NextResponse } from "next/server";
import { createGiftInBDD } from "@/app/api/ApiEmailCodes";
import { TransactionStatus } from "@/app/constants";

export async function POST(req: NextRequest) {
  try {
    
    const body = await req.json(); // ✅ Lire une seule fois
    console.log("▶ Requête reçue :", body);

    const { paymentTxHash, email, tokenId, offererName, txStatus } = body;

    let txStatusEnum: TransactionStatus;

    if (txStatus === "pending") {
      txStatusEnum = TransactionStatus.TX_PENDING;
    } else if (txStatus === "confirmed") {
      txStatusEnum = TransactionStatus.TX_CONFIRMED;
    } else {
      return NextResponse.json({ error: `txStatus invalide: ${txStatus}.` }, { status: 400 });
    }

    if (!paymentTxHash || !email || !tokenId || !offererName || !txStatus) {
      return NextResponse.json(
        { error: "Champs requis manquants : paymentTxHash, email, tokenId, offererName, txStatus" },
        { status: 400 }
      );
    }

    const saved = await createGiftInBDD(
      paymentTxHash,
      email,
      tokenId,
      offererName,
      txStatus
    );

    if (!saved) {
      return NextResponse.json(
        { error: `Échec lors de l'enregistrement du gift avec paymentTxHash: ${paymentTxHash}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Enregistrement réussi avec paymentTxHash: ${paymentTxHash}`
    });

  } catch (err: any) {
    console.error("❌ Erreur dans /api/check-transaction :", err);
    return NextResponse.json(
      { error: err?.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
