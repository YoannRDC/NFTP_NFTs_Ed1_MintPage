import { claimTo as claimToERC721 } from "thirdweb/extensions/erc721";
import { claimTo as claimToERC1155 } from "thirdweb/extensions/erc1155";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { getNftContract, maskSecretKey } from "./ApiPaymentReception";
import { PaymentMetadata } from "./PaymentMetadata";
import { DistributionType, getProjectMinterAddress, getProjectMinterPrivateKeyEnvName, TransactionStatus  } from "../constants";
import { createNFTtxInBDD, NFTtxRecord } from "./ApiEmailCodes";

export interface DistributionResult {
  transaction: any; 
}

export async function proceedSendGiftEmail(paymentMetadata: PaymentMetadata) {
  // be sure to call only when TransactionStatus.TX_CONFIRMED or stripe.
  if (!paymentMetadata.paymentTxRefStripe) {
    throw new Error("paymentTxRefStripe est requis pour enregistrer le cadeau.");
  }

  const nftTxRecord: NFTtxRecord = await createNFTtxInBDD(
    paymentMetadata.paymentTxRefStripe,
    paymentMetadata.recipientWalletAddressOrEmail,
    paymentMetadata.tokenId,
    paymentMetadata.offererName ?? '',
    TransactionStatus.TX_CONFIRMED
  );

  console.log("✅ stripe-webhook proceedSendGiftEmail ...");
  console.log("email:", nftTxRecord.email);
  console.log("tokenId:", nftTxRecord.tokenId);
  console.log("downloadCode:", nftTxRecord.code);
  console.log("offererName:", nftTxRecord.offererName);
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

  let tx;

  if (paymentMetadata.distributionType === DistributionType.ClaimToERC1155) {
    tx = claimToERC1155({
      contract: nftContract,
      to: paymentMetadata.recipientWalletAddressOrEmail,
      quantity: BigInt(paymentMetadata.requestedQuantity),
      from: minterAddress,
      tokenId: BigInt(paymentMetadata.tokenId),
    });
  } else if (paymentMetadata.distributionType === DistributionType.ClaimToERC721) {
    tx = claimToERC721({
      contract: nftContract,
      to: paymentMetadata.recipientWalletAddressOrEmail,
      quantity: BigInt(paymentMetadata.requestedQuantity),
      from: minterAddress,
    });
  } else if (paymentMetadata.distributionType === DistributionType.SafeTransferFromERC721) {
    tx = prepareContractCall({
      contract: nftContract,
      method: "function safeTransferFrom(address from, address to, uint256 tokenId)",
      params: [
        minterAddress,
        paymentMetadata.recipientWalletAddressOrEmail,
        BigInt(paymentMetadata.tokenId)
      ],
    });
  } else if (paymentMetadata.distributionType === DistributionType.SafeTransferFromERC1155) {
    const data = "0x"; // À compléter si nécessaire.
    tx = prepareContractCall({
      contract: nftContract,
      method: "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
      params: [
        minterAddress,
        paymentMetadata.recipientWalletAddressOrEmail,
        BigInt(paymentMetadata.tokenId),
        BigInt(paymentMetadata.requestedQuantity),
        data,
      ],
    });
  } else if (paymentMetadata.distributionType === DistributionType.EmailCode) {
    throw new Error(`Not supposed to call distribute NFT with DistributionType.EmailCode`);
  } else {
    throw new Error(`Unknown distributionType: ${paymentMetadata.distributionType}`);
  }

  // Vérifier que la transaction a bien été préparée.
  if (!tx) {
    throw new Error("La transaction n'a pas pu être préparée.");
  }

  // Récupérer la clé privée à partir des variables d'environnement.
  const privateKeyEnvName = getProjectMinterPrivateKeyEnvName(paymentMetadata.projectName);
  const minterPrivateKey = process.env[privateKeyEnvName];
  if (!minterPrivateKey) {
    throw new Error("Missing minterPrivateKey, privateKeyEnvName: privateKeyEnvName: "+ privateKeyEnvName);
  }

  const account = privateKeyToAccount({
    client,
    privateKey: minterPrivateKey,
  });

  const result = await sendTransaction({
    transaction: tx,
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
    transaction: safeResult,
  };
}

