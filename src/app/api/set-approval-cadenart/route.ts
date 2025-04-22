import { NextRequest, NextResponse } from "next/server";
import {
  createThirdwebClient,
  defineChain,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operator, approved, adminCode } = body;

    // 🔐 Sécurité : vérifie le code admin
    const expectedCode = process.env.ADMIN_CODE;
    if (adminCode !== expectedCode) {
      return NextResponse.json(
        { error: "Code d'autorisation invalide." },
        { status: 403 }
      );
    }

    if (typeof operator !== "string" || typeof approved !== "boolean") {
      return NextResponse.json(
        { error: "Champs invalides : 'operator' doit être une adresse et 'approved' un booléen." },
        { status: 400 }
      );
    }

    // 🔗 Variables de config
    const NFT_CONTRACT_ADDRESS = "0x2d4108d38b19B8acC72B83B7Facb46dB0ECCe237";
    const PRIVATE_KEY = process.env.PRIVATE_KEY_CADENART!;
    const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_API_SECRET_KEY!;
    const CHAIN_ID = process.env.CHAIN_ID || "137";

    const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
    const chain = defineChain(Number(CHAIN_ID));
    const contract = getContract({ client, chain, address: NFT_CONTRACT_ADDRESS });
    const account = privateKeyToAccount({ client, privateKey: PRIVATE_KEY });

    // ⚙️ Prépare et envoie la transaction
    const transaction = prepareContractCall({
      contract,
      method: "function setApprovalForAll(address operator, bool approved)",
      params: [operator, approved],
    });

    const txResult = await sendTransaction({ transaction, account });

    if (!txResult || !txResult.transactionHash) {
      return NextResponse.json(
        { error: "Transaction échouée ou hash manquant." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Autorisation ${approved ? "activée" : "révoquée"} pour l’opérateur ${operator}`,
      transactionHash: txResult.transactionHash,
    });
  } catch (error: any) {
    console.error("Erreur lors de l'approbation :", error);
    return new NextResponse(
      JSON.stringify({
        error: { message: error.message, stack: error.stack },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
