import { NextRequest, NextResponse } from "next/server";
import { TransactionStatus } from "@/app/constants";
import { createGiftInBDD, sendDownloadEmail, updateGiftStatus } from "@/app/api/ApiEmailCodes";
import { createClient } from "redis";
import { processTransaction } from "../TransactionService";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export async function POST(req: NextRequest) {
  try {

    const body = await req.json(); // ✅ Lire une seule fois
    console.log("▶ Requête reçue :", body);

    const { paymentTxHash } = body;

    if (!paymentTxHash) {
      return NextResponse.json(
        { error: "Champs requis manquants : paymentTxHash" },
        { status: 400 }
      );
    }

    processTransaction(paymentTxHash);

  } catch (err: any) {
    console.error("❌ Erreur dans /api/check-transaction :", err);
    return NextResponse.json(
      { error: err?.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
