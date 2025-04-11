import { claimTo as claimToERC721 } from "thirdweb/extensions/erc721";
import { claimTo as claimToERC1155 } from "thirdweb/extensions/erc1155";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { getNftContract, initializeThirdwebClient, maskSecretKey } from "./ApiCommons";
import { PaymentMetadata } from "./PaymentMetadata";
import { getProjectMinterAddress } from "../constants";
// import { projectMappings } from "../constants"; // à utiliser si nécessaire

// Définir un type pour le résultat de distribution,
// combinant les métadonnées initiales et les données de transaction.
export interface DistributionResult {
  metadata: PaymentMetadata;
  transaction: any; // Remplacez par le type exact retourné par sendTransaction si disponible.
}

/**
 * Distribue un NFT en fonction des métadonnées de paiement.
 *
 * @param paymentMetadata - Les métadonnées issues du paymentIntent contenant les informations de distribution.
 * @returns Un objet DistributionResult contenant les métadonnées d'origine et le résultat de la transaction.
 */
export async function distributeNFT(client: any, paymentMetadata: PaymentMetadata): Promise<DistributionResult> {

  const nftContract = getNftContract(client, Number(paymentMetadata.blockchainId), paymentMetadata.nftContractAddress);
  const minterAddress = getProjectMinterAddress(paymentMetadata.projectName);

  let transaction;

  if (paymentMetadata.distributionType === "claimToERC1155") {
    transaction = claimToERC1155({
      contract: nftContract,
      to: paymentMetadata.recipientWalletAddress,
      quantity: BigInt(paymentMetadata.requestedQuantity),
      from: minterAddress,
      tokenId: BigInt(paymentMetadata.tokenId),
    });
  } else if (paymentMetadata.distributionType === "claimToERC721") {
    transaction = claimToERC721({
      contract: nftContract,
      to: paymentMetadata.recipientWalletAddress,
      quantity: BigInt(paymentMetadata.requestedQuantity),
      from: minterAddress,
    });
  } else if (paymentMetadata.distributionType === "safeTransferFromERC721") {
    transaction = prepareContractCall({
      contract: nftContract,
      method: "function safeTransferFrom(address from, address to, uint256 tokenId)",
      params: [minterAddress, paymentMetadata.recipientWalletAddress, BigInt(paymentMetadata.tokenId)],
    });
  } else if (paymentMetadata.distributionType === "safeTransferFromERC1155") {
    const data = "0x"; // À compléter si nécessaire.
    transaction = prepareContractCall({
      contract: nftContract,
      method: "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
      params: [
        minterAddress,
        paymentMetadata.recipientWalletAddress,
        BigInt(paymentMetadata.tokenId),
        BigInt(paymentMetadata.requestedQuantity),
        data,
      ],
    });
  } else {
    throw new Error(`Unknown distributionType: ${paymentMetadata.distributionType}`);
  }

  // Vérifier que la transaction a bien été préparée.
  if (!transaction) {
    throw new Error("La transaction n'a pas pu être préparée.");
  }

  // Récupérer la clé privée à partir des variables d'environnement.
  const minterPrivateKey = process.env.PRIVATE_KEY;
  if (!minterPrivateKey) {
    throw new Error(
      "La clé privée n'est pas définie dans les variables d'environnement (process.env.PRIVATE_KEY)."
    );
  }

  const account = privateKeyToAccount({
    client,
    privateKey: minterPrivateKey,
  });

  const result = await sendTransaction({
    transaction,
    account,
  });

  const safeResult = {
    ...result,
    client: {
      ...result.client,
      secretKey: maskSecretKey(result.client.secretKey!),
    },
  };

  console.log("Transaction result:", safeResult);

  return {
    metadata: paymentMetadata,
    transaction: safeResult,
  };
}