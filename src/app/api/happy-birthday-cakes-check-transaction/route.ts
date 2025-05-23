import { NextRequest, NextResponse } from "next/server";
import { processNFTtx } from "../ApiTransactionService";

export async function POST(req: NextRequest) {
  try {
    const { paymentTxHash } = await req.json();

    if (!paymentTxHash) {
      return NextResponse.json({ error: "paymentTxHash requis" }, { status: 400 });
    }

    const result = await processNFTtx(paymentTxHash);
    return NextResponse.json(result.body, { status: result.status });

  } catch (err: any) {
    console.error("❌ Erreur dans /api/dao-process-transaction :", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
