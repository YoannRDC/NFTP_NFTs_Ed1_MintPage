"use client";

import { prepareTransaction, sendTransaction, toWei } from "thirdweb";
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";
import { createGiftInBDD, updateGiftStatus } from "../api/ApiEmailCodes";
import { TransactionStatus } from "../constants";

export interface CryptoPaymentParams {
  client: any;                 // Instance du client thirdweb
  chain: any;                  // Chaîne utilisée (exemple : polygon)
  priceInPol: number | string; // Le montant en POL (ou équivalent) à payer
  minterAddress: string;       // Adresse du minter (destinataire du paiement)
  account: any;                // L'objet account (issu de useActiveAccount)
  gasPrice?: bigint;           // Optionnel : le gasPrice à utiliser pour la transaction
  email?:string;
  tokenId: string,
  offererName?: string,
}

export interface CryptoPaymentResult {
  hash: string;
  status: "confirmed" | "pending";
}

/**
 * Effectue la transaction crypto pour le paiement et vérifie si elle est confirmée.
 *
 * @returns Un objet contenant le hash et le statut de confirmation.
 */
export async function performCryptoPaymentAndStoreTxInBdd({
  client,
  chain,
  priceInPol,
  minterAddress,
  account,
  gasPrice = 30000000000n,
  email,
  tokenId,
  offererName,
}: CryptoPaymentParams): Promise<CryptoPaymentResult> {
  const transaction = prepareTransaction({
    to: minterAddress,
    chain: chain,
    client: client,
    value: toWei(priceInPol.toString()),
    gasPrice: gasPrice,
  });

  const receipt = await sendTransaction({ transaction, account });
  const paymentTxHash = receipt.transactionHash;
  console.log("Transaction envoyée :", paymentTxHash);

  const cryptoPaymentResult: CryptoPaymentResult = {
    hash: paymentTxHash,
    status: "pending",
  }

  await createGiftInBDD(paymentTxHash, email!, tokenId, offererName!, TransactionStatus.TX_PENDING );

  const rpcRequest = getRpcClient({ client, chain });

  // 🔁 On vérifie jusqu’à 5 fois toutes les 15 secondes (total ~75s)
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 15000));

    const paymentTx = await eth_getTransactionByHash(rpcRequest, {
      hash: paymentTxHash,
    });

    if (paymentTx?.blockNumber) {
      console.log("Transaction confirmée :", paymentTxHash);

      await updateGiftStatus(cryptoPaymentResult.hash, TransactionStatus.TX_CONFIRMED);

      return {
        hash: paymentTxHash,
        status: "confirmed",
      };
    }

    console.log(`Tentative ${attempt + 1} : transaction toujours en attente...`);
  }

  console.warn("Transaction non confirmée après délai :", paymentTxHash);
  return {
    hash: paymentTxHash,
    status: "pending",
  };
}
