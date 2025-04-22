import { NextRequest, NextResponse } from "next/server";
import {
  createThirdwebClient,
  defineChain,
  getContract,
  sendTransaction,
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { claimTo } from "thirdweb/extensions/erc1155";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tokenId,
      amount,
      to,
      privateKey,
      nftContractAddress,
      chainId,
      adminCode,
    } = body;

    // 🔐 Vérification de sécurité
    const expectedCode = process.env.ADMIN_CODE;
    if (adminCode !== expectedCode) {
      return NextResponse.json({ error: "Code d'autorisation invalide." }, { status: 403 });
    }

    // ✅ Validation des paramètres
    if (!tokenId || !amount || !to || !privateKey || !nftContractAddress || !chainId) {
      return NextResponse.json(
        { error: "Champs requis manquants : tokenId, amount, to, privateKey, nftContractAddress, chainId." },
        { status: 400 }
      );
    }

    // ✅ Initialisation du client
    const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_API_SECRET_KEY!;
    const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
    const chain = defineChain(Number(chainId));
    const contract = getContract({ client, chain, address: nftContractAddress });
    const account = privateKeyToAccount({ client, privateKey });

    // 🔁 Création et envoi de la transaction
    const transaction = claimTo({
      contract,
      to,
      tokenId: BigInt(tokenId),
      quantity: BigInt(amount),
    });

    const { transactionHash } = await sendTransaction({ transaction, account });

    return NextResponse.json({
      message: `✅ ${amount} unités du tokenId ${tokenId} envoyées à ${to}`,
      transactionHash,
    });
  } catch (error: any) {
    console.error("Erreur claimTo :", error);
    return new NextResponse(
      JSON.stringify({ error: { message: error.message, stack: error.stack } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
