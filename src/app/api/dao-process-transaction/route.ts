import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { processNFTtx } from "../ApiTransactionService";

// Redis déjà instancié dans processTransaction, donc pas utile ici
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Requête reçue :", body);

    const { paymentTxHash } = body;

    if (!paymentTxHash) {
      return NextResponse.json(
        { error: "Champs requis manquants : paymentTxHash" },
        { status: 400 }
      );
    }

    // ✅ On attend et retourne le résultat de processTransaction
    const result = await processNFTtx(paymentTxHash);
    return NextResponse.json(result.body, { status: result.status });

  } catch (err: any) {
    console.error("❌ Erreur dans /api/dao-process-transaction :", err);
    return NextResponse.json(
      { error: err?.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
