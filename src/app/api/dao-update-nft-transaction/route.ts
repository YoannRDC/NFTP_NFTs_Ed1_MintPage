import { NextRequest, NextResponse } from "next/server";
import { TransactionStatus } from "@/app/constants";
import { updateGiftStatus } from "@/app/api/ApiEmailCodes";

export async function POST(req: NextRequest) {
  try {

    const body = await req.json(); // ✅ Lire une seule fois
    console.log("▶ Requête reçue :", body);

    const { paymentTxHash, txStatus } = body;

    if (!paymentTxHash || !txStatus) {
      return NextResponse.json(
        { error: "Champs requis manquants : paymentTxHash, txStatus" },
        { status: 400 }
      );
    }

    const isUpdated = await updateGiftStatus(paymentTxHash, txStatus);

    if (!isUpdated) {
      return NextResponse.json(
        { error: `Échec lors de l'update du status de: ${paymentTxHash}` },
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
