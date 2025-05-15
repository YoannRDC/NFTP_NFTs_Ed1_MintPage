import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { ethers } from "ethers";
import { TransactionStatus } from "@/app/constants";
import { GiftRecord, sendDownloadEmail, updateGiftStatus } from "@/app/api/ApiEmailCodes";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); // adapte au réseau utilisé

export async function POST(req: NextRequest) {
  try {
    const { txHash } = await req.json();

    if (!txHash) {
      return NextResponse.json({ error: "txHash requis" }, { status: 400 });
    }

    const key = `nft_gift:${txHash}`;
    const raw = await redis.get(key);

    if (!raw) {
      return NextResponse.json({ error: "Transaction inconnue." }, { status: 404 });
    }

    const giftRecord: GiftRecord = JSON.parse(raw);

    // Lecture du statut de la transaction sur la blockchain
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return NextResponse.json({
        error: "Transaction inconnue sur la blockchain."
      }, { status: 202 }); // 202 = Accepted
    }

    if (receipt.status === 0) {
        if (giftRecord.status !== TransactionStatus.TX_FAILED) {
            await updateGiftStatus(txHash, TransactionStatus.TX_FAILED);
        }
      return NextResponse.json({
        error: "❌ La transaction a échoué. Aucune somme ne sera débitée. Veuillez recommencer l'achat."
      }, { status: 400 });
    }

    // Ici la transaction est confirmée (status === 1)
    // Si on est dans un état qui nécessite l’envoi ou la relance de l’email :
    if (
      giftRecord.status === TransactionStatus.EMAIL_FAILED ||
      giftRecord.status === TransactionStatus.EMAIL_SENT
    ) {
      const result = await sendDownloadEmail(giftRecord);

      if (result === "ok") {
        await updateGiftStatus(txHash, TransactionStatus.EMAIL_SENT);
        return NextResponse.json({ message: "✅ Email (re)envoyé avec succès." });
      } else {
        await updateGiftStatus(txHash, TransactionStatus.EMAIL_FAILED);
        return NextResponse.json({
          error: "La transaction est confirmée, mais l'envoi de l'email a échoué. Veuillez réessayer plus tard."
        }, { status: 500 });
      }
    } 

    // Si rien à faire
    return NextResponse.json({ message: `Aucune action requise. Statut actuel : ${giftRecord.status}` });

  } catch (err: any) {
    console.error("❌ Erreur dans /api/check-transaction :", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
