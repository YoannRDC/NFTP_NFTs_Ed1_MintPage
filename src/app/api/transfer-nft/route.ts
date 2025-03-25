import { NextRequest, NextResponse } from "next/server";
import { 
  createThirdwebClient, 
  defineChain, 
  getContract, 
  prepareContractCall, 
  sendTransaction, 
  toWei
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { 
  getProjectPublicKey,
  getProjectPrivateKeyEnvName,
  getNFTEuroPrice,
  getNFTPolPrice
} from "@/app/constants"; // Adaptez le chemin si nécessaire
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";
import { polygon } from "thirdweb/chains";

// Vérification simple d'une adresse Ethereum
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export async function POST(req: NextRequest) {
  try {
    const { 
      tokenId, 
      buyerWalletAddress, 
      nftContractAddress, 
      blockchainId, 
      contractType,
      paymentTxHash, 
      projectName
    } = await req.json();

    // Validation des paramètres de base
    if (!isValidEthereumAddress(buyerWalletAddress)) {
      return NextResponse.json({ error: "Adresse de l'acheteur invalide" }, { status: 400 });
    }
    if (!isValidEthereumAddress(nftContractAddress)) {
      return NextResponse.json({ error: "Adresse du contrat NFT invalide" }, { status: 400 });
    }
    if (contractType !== "erc721transfert") {
      return NextResponse.json({ error: "Type de contrat non supporté" }, { status: 400 });
    }
    if (!paymentTxHash) {
      return NextResponse.json({ error: "Identifiant de transaction de paiement manquant" }, { status: 400 });
    }
    if (!process.env.THIRDWEB_API_SECRET_KEY) {
      return NextResponse.json({ error: "THIRDWEB_API_SECRET_KEY manquant" }, { status: 500 });
    }
    
    // Récupérer le nom de la variable d'environnement pour la clé privée via la fonction getProjectPrivateKeyEnvName
    const privateKeyEnvName = getProjectPrivateKeyEnvName(projectName);
    const privateKey = process.env[privateKeyEnvName];
    if (!privateKey) {
      return NextResponse.json({ error: `Clé privée pour le projet ${projectName} manquante` }, { status: 500 });
    }

    // Création du client Thirdweb
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_API_SECRET_KEY,
    });
    console.log("Client créé avec l'id :", client.clientId);

    // Récupération du contrat NFT sur la chaîne spécifiée
    const nftContract = getContract({
      client,
      chain: defineChain(Number(blockchainId)),
      address: nftContractAddress,
    });
    
    // Récupération de la transaction de paiement via eth_getTransactionByHash
    const rpcRequest = getRpcClient({ client, chain: polygon });
    const paymentTx = await eth_getTransactionByHash(rpcRequest, {
      hash: paymentTxHash,
    });
    console.log("paymentTx: ", paymentTx);

    // Vérifier que la transaction est confirmée (inclusion dans un bloc)
    if (!paymentTx.blockNumber) {
      return NextResponse.json({ error: "La transaction de paiement n'est pas confirmée" }, { status: 400 });
    }

    // Récupération de l'adresse du minter via le mapping en fonction du projectName
    const minterAddress = getProjectPublicKey(projectName);

    // Vérifier que le destinataire de la transaction est bien le minter attendu
    if (!paymentTx.to || paymentTx.to.toLowerCase() !== minterAddress.toLowerCase()) {
      return NextResponse.json({ error: "Le destinataire de la transaction de paiement n'est pas le minter" }, { status: 400 });
    }

    // Récupération du prix en euros et conversion en POL
    const artcardEuroPrice = getNFTEuroPrice(projectName, tokenId);
    const artcardPolPrice = await getNFTPolPrice(projectName, tokenId);
    const artcardPolWeiPrice = toWei(artcardPolPrice.toString());

    console.error("tokenId: ", tokenId);
    console.error("artcardEuroPrice: ", artcardEuroPrice);
    console.error("artcardPolPrice: ", artcardPolPrice);
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

    // Préparation de l'appel à safeTransferFrom pour transférer le NFT
    const transaction = prepareContractCall({
      contract: nftContract,
      method: "function safeTransferFrom(address from, address to, uint256 tokenId)",
      params: [minterAddress, buyerWalletAddress, tokenId],
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
    console.error("Erreur dans la route transfer-nft :", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
