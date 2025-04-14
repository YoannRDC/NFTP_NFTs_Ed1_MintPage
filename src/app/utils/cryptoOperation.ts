"use client";

import { prepareTransaction, sendTransaction, toWei } from "thirdweb";
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";

export interface CryptoPaymentParams {
  client: any;                 // Instance du client thirdweb
  chain: any;                  // Chaîne utilisée (exemple : polygon)
  priceInPol: number | string; // Le montant en POL (ou équivalent) à payer
  minterAddress: string;       // Adresse du minter (destinataire du paiement)
  account: any;                // L'objet account (issu de useActiveAccount)
  gasPrice?: bigint;           // Optionnel : le gasPrice à utiliser pour la transaction
}

/**
 * Effectue la transaction crypto pour le paiement et retourne la transaction confirmée.
 *
 * @param params Les paramètres pour effectuer le paiement.
 * @returns La transaction de paiement une fois confirmée.
 * @throws Une erreur si la transaction n'est pas confirmée.
 */
export async function performCryptoPayment({
  client,
  chain,
  priceInPol,
  minterAddress,
  account,
  gasPrice = 30000000000n,
}: CryptoPaymentParams): Promise<string> {
  // Préparation de la transaction : envoi de la valeur convertie en wei vers le minter
  const transaction = prepareTransaction({
    to: minterAddress,
    chain: chain,
    client: client,
    value: toWei(priceInPol.toString()),
    gasPrice: gasPrice,
  });

  // Envoi de la transaction via sendTransaction
  const receipt = await sendTransaction({ transaction, account });
  const paymentTxHashCrypto = receipt.transactionHash;
  console.log("Transaction de paiement envoyée:", paymentTxHashCrypto);

  // Attente d'environ 15 secondes pour laisser le temps à la transaction de se confirmer
  await new Promise((resolve) => setTimeout(resolve, 15000));
  console.log("15 secondes écoulées, vérification de la transaction...");

  // Récupération d'un client RPC et vérification de la transaction via son hash
  const rpcRequest = getRpcClient({ client, chain });
  const paymentTx = await eth_getTransactionByHash(rpcRequest, {
    hash: paymentTxHashCrypto,
  });
  console.log("Détails de la transaction de paiement:", paymentTx);

  // Si aucun numéro de bloc n'est présent, la transaction n'est pas confirmée
  if (!paymentTx.blockNumber) {
    throw new Error("La transaction de paiement n'est pas confirmée");
  }
  console.log("Transaction de paiement confirmée :", paymentTxHashCrypto);

  return paymentTx.hash;
}
