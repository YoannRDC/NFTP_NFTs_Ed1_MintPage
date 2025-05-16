import { NextRequest, NextResponse } from "next/server";
import { createGiftInBDD } from "@/app/api/ApiEmailCodes";

export async function POST(req: NextRequest) {
  try {
    console.log("▶ Requête reçue :", await req.json());

    const { paymentTxHash, email, tokenId, offererName, txStatus } = await req.json();

    if (!["TX_PENDING", "TX_CONFIRMED"].includes(txStatus)) {
      return NextResponse.json({ error: "txStatus invalide" }, { status: 400 });
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
