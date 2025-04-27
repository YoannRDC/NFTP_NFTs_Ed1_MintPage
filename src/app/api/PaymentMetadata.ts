import { NextRequest, NextResponse } from "next/server";

// Définition de votre type PaymentMetadata
export interface PaymentMetadata {
  projectName: string;
  distributionType: string;
  buyerWalletAddress: string;
  recipientWalletAddressOrEmail: string;
  nftContractAddress: string;
  blockchainId: string;
  tokenId: string;
  requestedQuantity: string;
  paymentPriceFiat?: string;
  paymentTxHashCrypto?: string;
  offererName?: string;
}
  
// Fonction de validation d'une adresse Ethereum
function isValidEthereumAddress(address: string): boolean {																				  
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Vérifie si c'est une adresse email basique
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Vérifie si c'est une adresse Ethereum OU une adresse email
function isValidEthereumAddressOrEmail(input: string): boolean {
  return isValidEthereumAddress(input) || isValidEmail(input);
}

/**
 * Extrait les métadonnées d’un objet paymentIntent provenant de Stripe.
 * Retourne soit l'objet PaymentMetadata en cas de succès, soit une réponse d'erreur (NextResponse)
 */
export function extractPaymentMetadataStripe(paymentIntent: any): PaymentMetadata | NextResponse {
  console.log("PaymentIntent data:", paymentIntent);
								 
  const paymentMetadata: PaymentMetadata = {
    projectName: paymentIntent.metadata.projectName,
    distributionType: paymentIntent.metadata.distributionType,
    buyerWalletAddress: paymentIntent.metadata.buyerWalletAddress,
    recipientWalletAddressOrEmail: paymentIntent.metadata.recipientWalletAddressOrEmail,
    nftContractAddress: paymentIntent.metadata.nftContractAddress,
    blockchainId: paymentIntent.metadata.blockchainId,
    tokenId: paymentIntent.metadata.tokenId,
    requestedQuantity: paymentIntent.metadata.requestedQuantity,
    paymentPriceFiat: paymentIntent.metadata.paymentPriceFiat,
    offererName: paymentIntent.metadata.offererName
  };

  // Validation des adresses Ethereum
  if (!isValidEthereumAddress(paymentMetadata.buyerWalletAddress)) {
    console.error("Invalid buyer wallet address");
    return NextResponse.json({ error: "Invalid buyer wallet address" }, { status: 400 });
  }
  if (!isValidEthereumAddress(paymentMetadata.recipientWalletAddressOrEmail)) {
    console.error("Invalid recipient wallet address");
    return NextResponse.json({ error: "Invalid recipient wallet address" }, { status: 400 });
  }
  if (!isValidEthereumAddress(paymentMetadata.nftContractAddress)) {
    console.error("Invalid NFT contract address");
    return NextResponse.json({ error: "Invalid NFT contract address" }, { status: 400 });
  }

  // Vérification de la présence de la clé API thirdweb
  if (!process.env.THIRDWEB_API_SECRET_KEY) {
    console.error("Missing THIRDWEB_API_SECRET_KEY");
    return NextResponse.json({ error: "Missing THIRDWEB_API_SECRET_KEY" }, { status: 400 });
  }

  // Vérification de la présence du projectName
  if (!paymentMetadata.projectName) {
    console.error("Missing projectName in metadata");
    return NextResponse.json({ error: "Missing projectName" }, { status: 400 });
  }
													  
  return paymentMetadata;
}


  /**
 * Extrait les métadonnées d’un objet paymentIntent provenant de Stripe.
 *
 * @param paymentIntent - L’objet paymentIntent contenant la propriété metadata.
 * @returns Un objet PaymentMetadata avec les données extraites.
 */
  export async function extractPaymentMetadataCryptoTransfer(req: NextRequest): Promise<PaymentMetadata | NextResponse> {

  // Récupération et log des données de la requête
  const body = await req.json();
  console.log("Données de req.json():", body);

  const { 
    projectName,
    distributionType,
    buyerWalletAddress, 
    recipientWalletAddressOrEmail, 
    nftContractAddress, 
    blockchainId, 
    tokenId,
    requestedQuantity,
    paymentPriceFiat,
    paymentTxHashCrypto,
    offererName, 
  } = body;

    const paymentMetadata: PaymentMetadata = {
      projectName: projectName,
      distributionType: distributionType,
      buyerWalletAddress: buyerWalletAddress,
      recipientWalletAddressOrEmail: recipientWalletAddressOrEmail,
      nftContractAddress: nftContractAddress,
      blockchainId: blockchainId,
      tokenId: tokenId,
      requestedQuantity: requestedQuantity,
      paymentPriceFiat:paymentPriceFiat,
      paymentTxHashCrypto: paymentTxHashCrypto,
      offererName:offererName,
    };

    // Validation des paramètres de base
    if (!isValidEthereumAddress(paymentMetadata.buyerWalletAddress)) {
      return NextResponse.json({ error: "Adresse de l'acheteur invalide" }, { status: 400 });
    }
    // Validation des paramètres de base
    if (!isValidEthereumAddressOrEmail(paymentMetadata.recipientWalletAddressOrEmail)) {
      return NextResponse.json({ error: "Adresse de du receveur du NFT est invalide" }, { status: 400 });
    }
    if (!isValidEthereumAddress(paymentMetadata.nftContractAddress)) {
      return NextResponse.json({ error: "Adresse du contrat NFT invalide" }, { status: 400 });
    }
    if (!paymentMetadata.paymentTxHashCrypto) {
      return NextResponse.json({ error: "Identifiant de transaction de paiement manquant" }, { status: 400 });
    }
    if (!process.env.THIRDWEB_API_SECRET_KEY) {
      return NextResponse.json({ error: "THIRDWEB_API_SECRET_KEY manquant" }, { status: 500 });
    }

    return paymentMetadata;
  }
	 