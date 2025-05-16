import { NextRequest, NextResponse } from "next/server";
import { createGiftInBDD } from "@/app/api/ApiEmailCodes";
import { TransactionStatus } from "@/app/constants";

export async function POST(req: NextRequest) {
  try {
    
    const body = await req.json(); // ✅ Lire une seule fois
    console.log("▶ Requête reçue :", body);

    const { paymentTxHash, email, tokenId, offererName, txStatus } = body;

    if (!["pending", "confirmed"].includes(txStatus)) {
      return NextResponse.json({ error: `txStatus invalide: ${txStatus}.` }, { status: 400 });
    }

    let txStatusEnum: TransactionStatus;

    if (txStatus === "TX_PENDING") {
      txStatusEnum = TransactionStatus.TX_PENDING;
    } else if (txStatus === "TX_CONFIRMED") {
      txStatusEnum = TransactionStatus.TX_CONFIRMED;
    } else {
      throw new Error("txStatus invalide");
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
