import { NextRequest, NextResponse } from "next/server";
import {  
  createThirdwebClient,
  prepareContractCall, 
  sendTransaction, 
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { 
  getProjectMinterAddress,
  getProjectMinterPrivateKeyEnvName,
  getNFTEuroPrice,
  getNFTPolPriceInWei
} from "@/app/constants"; // Adaptez le chemin si nécessaire
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";
import { polygon } from "thirdweb/chains";
import { distributeNFT } from "../ApiRequestDistribution";
import { extractPaymentMetadataCryptoTransfer, PaymentMetadata } from "../PaymentMetadata";
import { getNftContract, initializeThirdwebClient } from "../ApiCommons";

export async function POST(req: NextRequest) {
  try {

    const metadataOrError = await extractPaymentMetadataCryptoTransfer(req);

    if (metadataOrError instanceof NextResponse) {
      return metadataOrError;
    }
    const paymentMetadata: PaymentMetadata = metadataOrError;

    // Récupérer le nom de la variable d'environnement pour la clé privée via la fonction getProjectPrivateKeyEnvName
    const privateKeyEnvName = getProjectMinterPrivateKeyEnvName(paymentMetadata.projectName);
    const privateKey = process.env[privateKeyEnvName];
    if (!privateKey) {
      return NextResponse.json({ error: `Clé privée pour le projet ${paymentMetadata.projectName} manquante` }, { status: 500 });
    }

    const client = initializeThirdwebClient();
    if (client instanceof NextResponse) {
      return metadataOrError;
    }
    const nftContract = getNftContract(client, Number(paymentMetadata.blockchainId), paymentMetadata.nftContractAddress);
    
    // Récupération de la transaction de paiement via eth_getTransactionByHash
    const rpcRequest = getRpcClient({ client, chain: polygon });
    const paymentTx = await eth_getTransactionByHash(rpcRequest, {
      hash: paymentMetadata.paymentTxHashCrypto as `0x${string}`,
    });
    console.log("paymentTx: ", paymentTx);

    // Vérifier que la transaction est confirmée (inclusion dans un bloc)
    if (!paymentTx.blockNumber) {
      return NextResponse.json({ error: "La transaction de paiement n'est pas confirmée" }, { status: 400 });
    }

    // Récupération de l'adresse du minter via le mapping en fonction du projectName
    const minterAddress = getProjectMinterAddress(paymentMetadata.projectName);

    // Vérifier que le destinataire de la transaction est bien le minter attendu
    if (!paymentTx.to || paymentTx.to.toLowerCase() !== minterAddress.toLowerCase()) {
      return NextResponse.json({ error: "Le destinataire de la transaction de paiement n'est pas le minter" }, { status: 400 });
    }

    // Récupération du prix en euros et conversion en POL (en wei)
    const artcardEuroPrice = getNFTEuroPrice(paymentMetadata.projectName, paymentMetadata.tokenId);
    const artcardPolWeiPrice = await getNFTPolPriceInWei(paymentMetadata.projectName, paymentMetadata.tokenId);

    console.error("tokenId: ", paymentMetadata.tokenId);
    console.error("buyerWalletAddress: ", paymentMetadata.buyerWalletAddress);
    console.error("recipientWalletAddress: ", paymentMetadata.recipientWalletAddress);
    console.error("artcardEuroPrice: ", artcardEuroPrice);
    console.error("paymentTx.value: ", paymentTx.value);
    console.error("artcardPolWeiPrice: ", artcardPolWeiPrice);

    // Calculer la différence absolue entre le montant payé et le prix attendu
    const diff = paymentTx.value >= artcardPolWeiPrice 
      ? paymentTx.value - artcardPolWeiPrice 
      : artcardPolWeiPrice - paymentTx.value;

    // Calculer la tolérance en fonction de 10 % du prix attendu (opérations en bigint)
    const toleranceWei = (artcardPolWeiPrice * 10n) / 100n;

    console.error("diff: ", diff);
    console.error("toleranceWei: ", toleranceWei);

    // Vérifier que l'écart est inférieur ou égal à la tolérance autorisée
    if (diff > toleranceWei) {
      const errorResponse = {
        error: "Le montant payé ne correspond pas au montant attendu (différence trop importante)",
        paid: paymentTx.value.toString(),
        expected: artcardPolWeiPrice.toString()
      };
      console.log("Erreur détaillée :", errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    distributeNFT(client, paymentMetadata);

    // Préparation de l'appel à safeTransferFrom pour transférer le NFT
    const transaction = prepareContractCall({
      contract: nftContract,
      method: "function safeTransferFrom(address from, address to, uint256 tokenId)",
      params: [minterAddress, paymentMetadata.recipientWalletAddress, BigInt(paymentMetadata.tokenId)],
    });

    // Création du compte minter à partir de la clé privée récupérée via le mapping
    const account = privateKeyToAccount({
      client,
      privateKey: privateKey,
    });
    console.log("Compte minter utilisé :", account.address);   
    console.log("NFT prêt à être transmis :", account.address);

    // Envoi de la transaction de transfert du NFT
    const result = await sendTransaction({
      transaction,
      account,
    });
    console.log("Transaction de transfert envoyée :", result.transactionHash); 

    return NextResponse.json({ transactionHash: result.transactionHash });
  } catch (error) {
    console.error("Erreur dans la route crypto-purchase :", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

