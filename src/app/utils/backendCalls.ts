import { DistributionType } from "../constants";

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
