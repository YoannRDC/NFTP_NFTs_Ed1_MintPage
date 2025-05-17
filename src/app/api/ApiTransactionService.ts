import { createClient } from "redis";
import { TransactionStatus } from "../constants";
import { NFTtxRecord, sendDownloadEmail, updateNFTtxStatus as updateNFTtxStatus } from "./ApiEmailCodes";
import { ethers } from "ethers";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();
// const RPC_URL = process.env.THIRDWEB_POLYGON_MAINNET_RPC_URL!;
const RPC_URL = "https://polygon-rpc.com"
const provider = new ethers.JsonRpcProvider(RPC_URL);

export async function processNFTtx(paymentTxHash: string): Promise<{ status: number; body: any }> {
  const key = `nft_tx:${paymentTxHash}`;
  const raw = await redis.get(key);

  if (!raw) {
    return {
      status: 404,
      body: { error: "Transaction inconnue." }
    };
  }

  const nftTxRecord: NFTtxRecord = JSON.parse(raw);
  const receipt = await provider.getTransactionReceipt(paymentTxHash);

  if (!receipt) {
    return {
      status: 202,
      body: { error: "Transaction inconnue sur la blockchain." }
    };
  }

  if (receipt.status === 0) {
    if (nftTxRecord.status !== TransactionStatus.TX_FAILED) {
      await updateNFTtxStatus(paymentTxHash, TransactionStatus.TX_FAILED);
    }
    return {
      status: 400,
      body: { error: "❌ La transaction a échoué. Aucune somme ne sera débitée. Veuillez recommencer l'achat." }
    };
  }

  // Si transaction confirmée
  if (
    nftTxRecord.status === TransactionStatus.TX_CONFIRMED ||
    nftTxRecord.status === TransactionStatus.EMAIL_FAILED ||
    nftTxRecord.status === TransactionStatus.EMAIL_SENT
  ) {
    const result = await sendDownloadEmail(nftTxRecord);

    if (result === "ok") {
      await updateNFTtxStatus(paymentTxHash, TransactionStatus.EMAIL_SENT);
      return {
        status: 200,
        body: { message: "✅ Email (re)envoyé avec succès." }
      };
    } else {
      await updateNFTtxStatus(paymentTxHash, TransactionStatus.EMAIL_FAILED);
      return {
        status: 500,
        body: { error: "La transaction est confirmée, mais l'envoi de l'email a échoué. Veuillez réessayer plus tard." }
      };
    }
  }

  return {
    status: 200,
    body: { message: `Aucune action requise. Statut actuel : ${nftTxRecord.status}` }
  };
}
