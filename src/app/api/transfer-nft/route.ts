// app/api/transfer-nft/route.ts
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
import { minterAddress } from "@/app/constants"; // Adaptez le chemin si nécessaire
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";
import { polygon } from "thirdweb/chains";

// Vérification simple d'une adresse Ethereum
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const EXPECTED_AMOUNT = toWei("1.0");

export async function POST(req: NextRequest) {
  try {
    const { 
      tokenId, 
      buyerWalletAddress, 
      nftContractAddress, 
      blockchainId, 
      contractType,
      paymentTxHash
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
    if (!process.env.PRIVATE_KEY_MINTER) {
      return NextResponse.json({ error: "PRIVATE_KEY_MINTER manquant" }, { status: 500 });
    }
    if (!process.env.POLYGON_RPC_URL) {
      return NextResponse.json({ error: "POLYGON_RPC_URL manquant" }, { status: 500 });
    }
    if (!process.env.EXPECTED_PRICE) {
      return NextResponse.json({ error: "EXPECTED_PRICE manquant" }, { status: 500 });
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

    // Vérifier que le destinataire de la transaction est bien le minter
    if (!paymentTx.to || paymentTx.to.toLowerCase() !== minterAddress.toLowerCase()) {
      return NextResponse.json({ error: "Le destinataire de la transaction de paiement n'est pas le minter" }, { status: 400 });
    }

    // Vérifier que le montant payé correspond à la valeur attendue (stockée côté serveur)
    console.log("paymentTxHash: ", paymentTxHash);
    console.log("EXPECTED_AMOUNT: ", EXPECTED_AMOUNT);
    // Convertir EXPECTED_AMOUNT en bigint pour la comparaison
    const expectedValue = BigInt(EXPECTED_AMOUNT);
    if (paymentTx.value !== expectedValue) {
      return NextResponse.json({ error: "Le montant payé ne correspond pas au montant attendu" }, { status: 400 });
    }

    // Préparation de l'appel à safeTransferFrom pour transférer le NFT
    const transaction = prepareContractCall({
      contract: nftContract,
      method: "function safeTransferFrom(address from, address to, uint256 tokenId)",
      params: [minterAddress, buyerWalletAddress, tokenId],
    });

    // Création du compte minter à partir de la clé privée stockée dans l'environnement
    const account = privateKeyToAccount({
      client,
      privateKey: process.env.PRIVATE_KEY_MINTER,
    });
    console.log("Compte minter utilisé :", account.address);

    
    console.log("NFT Pret a etre trnasmis !!  :", account.address);

/*     // Envoi de la transaction de transfert du NFT
    const result = await sendTransaction({
      transaction,
      account,
    });
    console.log("Transaction de transfert envoyée :", result.transactionHash); 

    return NextResponse.json({ transactionHash: result.transactionHash });*/
  } catch (error) {
    console.error("Erreur dans la route transfer-nft :", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
