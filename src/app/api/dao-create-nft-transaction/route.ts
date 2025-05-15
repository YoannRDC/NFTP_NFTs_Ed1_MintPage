import { NextRequest, NextResponse } from "next/server";
import { TransactionStatus } from "@/app/constants";
import { createGiftInBDD } from "@/app/api/ApiEmailCodes";

export async function POST(req: NextRequest) {
  try {
    const { paymentTxHash, email, tokenId, offererName } = await req.json();

    if (!paymentTxHash || !email || !tokenId || !offererName) {
      return NextResponse.json(
        { error: "Champs requis manquants : paymentTxHash, email, tokenId, offererName" },
        { status: 400 }
      );
    }

    const saved = await createGiftInBDD(
      paymentTxHash,
      email,
      tokenId,
      offererName,
      TransactionStatus.TX_PENDING
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
