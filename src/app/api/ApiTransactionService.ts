import { createClient } from "redis";
import { TransactionStatus } from "../constants";
import {
  NFTtxRecord,
  sendDownloadEmail,
  updateNFTtxStatus,
} from "./ApiEmailCodes";
import { ethers } from "ethers";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();
const RPC_URL = "https://polygon-rpc.com";
const provider = new ethers.JsonRpcProvider(RPC_URL);

export async function processNFTtx(
  paymentTxHash: string
): Promise<{ status: number; body: any }> {
  const key = `nft_tx:${paymentTxHash}`;
  const raw = await redis.get(key);

  if (!raw) {
    return {
      status: 404,
      body: { error: "Transaction inconnue." },
    };
  }

  const nftTxRecord: NFTtxRecord = JSON.parse(raw);

  const receipt = await provider.getTransactionReceipt(paymentTxHash);

  if (!receipt) {
    return {
      status: 202,
      body: {
        message:
          "❌ Transaction inconnue sur la blockchain.",
      },
    };
  }

  console.log("🧾 receipt:", receipt);

  // ❌ Transaction échouée sur la blockchain
  if (receipt.status === 0) {
    await updateNFTtxStatus(paymentTxHash, TransactionStatus.TX_FAILED);
    return {
      status: 400,
      body: {
        error:
          "❌ La transaction a échoué sur la blockchain. Aucune somme ne sera débitée. Veuillez recommencer l'achat.",
      },
    };
  }

  // ✅ Transaction confirmée : envoie de l’email (même si le statut en BDD est incohérent)
  const emailResult = await sendDownloadEmail(nftTxRecord);

  if (emailResult === "ok") {
    await updateNFTtxStatus(paymentTxHash, TransactionStatus.EMAIL_SENT);
    return {
      status: 200,
      body: {
        message: "Email envoyé avec succès après confirmation blockchain.",
      },
    };
  } else {
    await updateNFTtxStatus(paymentTxHash, TransactionStatus.EMAIL_FAILED);
    return {
      status: 500,
      body: {
        error:
          "La transaction est confirmée, mais l'envoi de l'email a échoué. Veuillez réessayer plus tard.",
      },
    };
  }
}
