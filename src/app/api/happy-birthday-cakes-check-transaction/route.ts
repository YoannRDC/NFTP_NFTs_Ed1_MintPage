import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { ethers } from "ethers";
import { processTransaction } from "../TransactionService";

export async function POST(req: NextRequest) {
  try {
    const { txHash } = await req.json();

    if (!txHash) {
      return NextResponse.json({ error: "txHash requis" }, { status: 400 });
    }

    const result = await processTransaction(txHash);
    return NextResponse.json(result.body, { status: result.status });

  } catch (err: any) {
    console.error("❌ Erreur dans /api/dao-process-transaction :", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
