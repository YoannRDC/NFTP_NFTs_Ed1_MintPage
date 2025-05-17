import { NextRequest, NextResponse } from "next/server";
import { createNFTtxInBDD } from "@/app/api/ApiEmailCodes";
import { TransactionStatus } from "@/app/constants";

export async function POST(req: NextRequest) {
  try {
    
    const body = await req.json(); // ✅ Lire une seule fois
    console.log("Requête reçue :", body);

    const { paymentTxHash, email, tokenId, offererName, txStatus } = body;

    const saved = await createNFTtxInBDD(
      paymentTxHash,
      email,
      tokenId,
      offererName,
      txStatus
    );

    if (!saved) {
      return NextResponse.json(
        { error: `Échec lors de l'enregistrement du NFTtx avec paymentTxHash: ${paymentTxHash}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Enregistrement réussi avec paymentTxHash: ${paymentTxHash}`
    });

  } catch (err: any) {
    console.error("❌ Erreur dans /api/dao-process-transaction :", err);
    return NextResponse.json(
      { error: err?.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
