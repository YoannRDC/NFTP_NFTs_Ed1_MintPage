import { NextRequest, NextResponse } from "next/server";
import { createThirdwebClient, prepareContractCall, sendTransaction, ThirdwebClient } from "thirdweb";
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
    // Extraction des métadonnées depuis la requête
    const metadataOrError = await extractPaymentMetadataCryptoTransfer(req);
    if (metadataOrError instanceof NextResponse) {
      return metadataOrError;
    }
    const paymentMetadata: PaymentMetadata = metadataOrError;

    // Récupérer la clé privée via le nom de variable d'environnement associé au projet
    const privateKeyEnvName = getProjectMinterPrivateKeyEnvName(paymentMetadata.projectName);
    const privateKey = process.env[privateKeyEnvName];
    if (!privateKey) {
      return NextResponse.json(
        { error: `Clé privée pour le projet ${paymentMetadata.projectName} manquante` },
        { status: 500 }
      );
    }

    // Initialisation du client Thirdweb
    const client = initializeThirdwebClient();
    if (client instanceof NextResponse) {
      return client;
    }
    const nftContract = getNftContract(client, Number(paymentMetadata.blockchainId), paymentMetadata.nftContractAddress);

    // Récupération de l'adresse du minter
    const minterAddress = getProjectMinterAddress(paymentMetadata.projectName);

    // Vérification de la transaction de paiement
    const validationResponse = await assertCryptoPaymentTransaction(client, paymentMetadata, minterAddress);
    if (validationResponse instanceof NextResponse) {
      return validationResponse;
    }
    
    // Distribution du NFT via la fonction dédiée
    const distributionResult = await distributeNFT(client, paymentMetadata);
    
    // Retour du hash de transaction dans la réponse JSON
    return NextResponse.json({ transactionHash: distributionResult.transaction });
  } catch (error) {
    console.error("Erreur dans la route crypto-purchase :", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

/**
 * Vérifie que la transaction de paiement (crypto transfer) est conforme aux attentes.
 * Renvoie un NextResponse en cas d'erreur ou undefined si tout est validé.
 */
async function assertCryptoPaymentTransaction(
  client: ThirdwebClient,
  paymentMetadata: PaymentMetadata,
  minterAddress: any
): Promise<NextResponse | void> {
  // Récupération de la transaction de paiement via eth_getTransactionByHash
  const rpcRequest = getRpcClient({ client, chain: polygon });
  const paymentTx = await eth_getTransactionByHash(rpcRequest, {
    hash: paymentMetadata.paymentTxHashCrypto as `0x${string}`,
  });
  console.log("paymentTx: ", paymentTx);

  // Vérifier que la transaction est confirmée
  if (!paymentTx.blockNumber) {
    return NextResponse.json(
      { error: "La transaction de paiement n'est pas confirmée" },
      { status: 400 }
    );
  }

  // Vérifier que le destinataire de la transaction est bien le minter attendu
  if (!paymentTx.to || paymentTx.to.toLowerCase() !== minterAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Le destinataire de la transaction de paiement n'est pas le minter" },
      { status: 400 }
    );
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

  // Calcul de la différence entre le montant payé et le montant attendu
  const diff = paymentTx.value >= artcardPolWeiPrice 
    ? paymentTx.value - artcardPolWeiPrice 
    : artcardPolWeiPrice - paymentTx.value;

  // Tolérance fixée à 10 % du montant attendu (en wei)
  const toleranceWei = (artcardPolWeiPrice * 10n) / 100n;

  console.error("diff: ", diff);
  console.error("toleranceWei: ", toleranceWei);

  // Vérification que l'écart reste dans la tolérance autorisée
  if (diff > toleranceWei) {
    const errorResponse = {
      error: "Le montant payé ne correspond pas au montant attendu (différence trop importante)",
      paid: paymentTx.value.toString(),
      expected: artcardPolWeiPrice.toString()
    };
    console.log("Erreur détaillée :", errorResponse);
    return NextResponse.json(errorResponse, { status: 400 });
  }
}
