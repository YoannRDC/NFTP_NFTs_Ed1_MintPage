import { DistributionType, TransactionStatus } from "../constants";

interface TransferNFTParams {
  projectName: string;
  distributionType: DistributionType;
  buyerWalletAddress: string;
  recipientWalletAddressOrEmail: string;
  nftContractAddress: string;
  blockchainId: number;
  tokenId: string;
  requestedQuantity: string;
  paymentTxHashCrypto: string;
  offererName: string;
}

/**
 * Effectue l'appel à l'API de transfert de NFT.
 *
 * @param params Les paramètres nécessaires au transfert.
 * @returns La réponse de l'API.
 * @throws Une erreur si la requête échoue.
 */
export async function callBackEndTransferNFT(params: TransferNFTParams): Promise<any> {
  const response = await fetch("/api/crypto-purchase", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectName: params.projectName,
      distributionType: params.distributionType,
      buyerWalletAddress: params.buyerWalletAddress,
      recipientWalletAddressOrEmail: params.recipientWalletAddressOrEmail,
      nftContractAddress: params.nftContractAddress,
      blockchainId: params.blockchainId,
      tokenId: params.tokenId,
      requestedQuantity: params.requestedQuantity,
      paymentTxHashCrypto: params.paymentTxHashCrypto,
      offererName: params.offererName,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Erreur lors du transfert NFT");
  }
  return data;
}

export async function createNFTtxInBDD_backend(paymentTxHash: string, email: string, tokenId: string, offererName: string, txStatus: TransactionStatus) {
    try {
    const res = await fetch("/api/dao-create-nft-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentTxHash, email, tokenId, offererName, txStatus}),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`❌ Erreur API /dao-create-nft-transaction : ${res.status} - ${text}`);
    } else {
      console.log(`${paymentTxHash} stored successfully.`);
    }

  } catch (err: any) {
    console.log(`❌ Erreur during dao-create-nft-transaction call from front end. : ${err.message}`);
  }
}

export async function processTx_backend(paymentTxHash: string): Promise<boolean> {
  try {

    console.log("paymentTxHash: ", paymentTxHash);

    const response = await fetch("/api/dao-create-nft-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentTxHash}),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ Erreur API processTx_backend (${response.status}): ${responseText}`);
      return false;
    }

    console.log(`✅ processTx_backend : traitement effectué pour ${paymentTxHash}. Réponse : ${responseText}`);
    return true;

  } catch (err: any) {
    console.error(`❌ Erreur réseau dans processTx_backend : ${err.message}`);
    return false;
  }
}