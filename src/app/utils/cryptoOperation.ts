"use client";

import { getGasPrice, prepareTransaction, sendTransaction, toWei } from "thirdweb";
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";
import { TransactionStatus } from "../constants";
import { polygon } from "thirdweb/chains";
import { createNFTtxInBDD_backend, processTx_backend } from "./backendCalls";

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
  email,
  tokenId,
  offererName,
}: CryptoPaymentParams): Promise<CryptoPaymentResult> {
  let paymentTxHash: string = "";

  try {
    console.debug("▶️ Récupération du gasPrice...");
    const gasPrice = await getGasPrice({
      client,
      chain: polygon,
      percentMultiplier: 2,
    });

    console.debug("✅ gasPrice récupéré :", gasPrice.toString());

    console.debug("▶️ Préparation de la transaction...");
    const transaction = prepareTransaction({
      to: minterAddress,
      chain,
      client,
      value: toWei(priceInPol.toString()),
      gasPrice,
    });

    console.debug("✅ Transaction préparée :", transaction);

    console.debug("▶️ Envoi de la transaction...");
    const receipt = await sendTransaction({ transaction, account });
    paymentTxHash = receipt.transactionHash;

    console.log("✅ Transaction envoyée avec succès :", paymentTxHash);
    console.debug("📧 Email :", email);
    console.debug("🆔 tokenId :", tokenId);
    console.debug("🎁 offererName :", offererName);

    console.debug("▶️ Enregistrement dans la BDD...");
    await createNFTtxInBDD_backend(
      paymentTxHash,
      email!,
      tokenId,
      offererName!,
      TransactionStatus.TX_PENDING
    );
    console.debug("✅ Enregistrement effectué");

    const rpcRequest = getRpcClient({ client, chain });

    console.debug("⏳ Vérification de la confirmation on-chain...");
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 15000));

      const paymentTx = await eth_getTransactionByHash(rpcRequest, {
        hash: paymentTxHash as `0x${string}`,
      });

      if (paymentTx?.blockNumber) {
        console.log("✅ Transaction confirmée :", paymentTxHash);

        const success = await processTx_backend(paymentTxHash);

        if (!success) {
          console.warn("🚨 Transaction confirmée mais le traitement backend a échoué.");
        }

        return {
          hash: paymentTxHash,
          status: "confirmed",
        };
      }

      console.log(`🔁 Tentative ${attempt + 1} : transaction toujours en attente...`);
    }

    console.warn("⚠️ Transaction non confirmée après délai :", paymentTxHash);
    return {
      hash: paymentTxHash,
      status: "pending",
    };
  } catch (error: any) {
    console.error("❌ Erreur dans performCryptoPaymentAndStoreTxInBdd :", error);
    return {
      hash: paymentTxHash,
      status: "pending",
    };
  }
}
