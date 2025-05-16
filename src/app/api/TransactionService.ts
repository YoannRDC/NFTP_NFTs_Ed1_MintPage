import { createClient } from "redis";
import { TransactionStatus } from "../constants";
import { GiftRecord, sendDownloadEmail, updateGiftStatus } from "./ApiEmailCodes";
import { ethers } from "ethers";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();
const provider = new ethers.JsonRpcProvider(process.env.THIRDWEB_POLYGON_MAINNET_RPC_URL);

export async function processTransaction(txHash: string): Promise<{ status: number; body: any }> {
  const key = `nft_gift:${txHash}`;
  const raw = await redis.get(key);

  if (!raw) {
    return {
      status: 404,
      body: { error: "Transaction inconnue." }
    };
  }

  const giftRecord: GiftRecord = JSON.parse(raw);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt) {
    return {
      status: 202,
      body: { error: "Transaction inconnue sur la blockchain." }
    };
  }

  if (receipt.status === 0) {
    if (giftRecord.status !== TransactionStatus.TX_FAILED) {
      await updateGiftStatus(txHash, TransactionStatus.TX_FAILED);
    }
    return {
      status: 400,
      body: { error: "❌ La transaction a échoué. Aucune somme ne sera débitée. Veuillez recommencer l'achat." }
    };
  }

  // Si transaction confirmée
  if (
    giftRecord.status === TransactionStatus.TX_CONFIRMED ||
    giftRecord.status === TransactionStatus.EMAIL_FAILED ||
    giftRecord.status === TransactionStatus.EMAIL_SENT
  ) {
    const result = await sendDownloadEmail(giftRecord);

    if (result === "ok") {
      await updateGiftStatus(txHash, TransactionStatus.EMAIL_SENT);
      return {
        status: 200,
        body: { message: "✅ Email (re)envoyé avec succès." }
      };
    } else {
      await updateGiftStatus(txHash, TransactionStatus.EMAIL_FAILED);
      return {
        status: 500,
        body: { error: "La transaction est confirmée, mais l'envoi de l'email a échoué. Veuillez réessayer plus tard." }
      };
    }
  }

  return {
    status: 200,
    body: { message: `Aucune action requise. Statut actuel : ${giftRecord.status}` }
  };
}
