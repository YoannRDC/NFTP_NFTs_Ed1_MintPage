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
      quantity,
      adminCode,
    } = body;

    // *******************************
    // !!!! README !!!!
    // Update these values before calling.
    // Call with workspace/python_tools/2025_04_21_ClaimTo-ERC1155/callBackEnd_ClaimTo.py
    // *****************************
    const privateKey = process.env.PRIVATE_KEY_BIRTHDAY_CAKES;
    const nftContractAddress = "0xc58b841a353ab2b288d8c79aa1f3307f32f77cbf";
    const chainId = "137";
    const to = "0x87e366F9F644c2dB43d9f24346C530F2915Be0d7";

    if (!privateKey) {
      throw new Error("La variable d'environnement PRIVATE_KEY_... est manquante.");
    }

    // 🔐 Vérification de sécurité
    const expectedCode = process.env.ADMIN_CODE;
    if (adminCode !== expectedCode) {
      return NextResponse.json({ error: "Code d'autorisation invalide." }, { status: 403 });
    }

    // ✅ Validation des paramètres
    const missingFields = [];
    if (!tokenId) missingFields.push("tokenId");
    if (!quantity) missingFields.push("quantity");
    if (!to) missingFields.push("to");
    if (!privateKey) missingFields.push("privateKey");
    if (!nftContractAddress) missingFields.push("nftContractAddress");
    if (!chainId) missingFields.push("chainId");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Champs requis manquants : ${missingFields.join(", ")}` },
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
      quantity: BigInt(quantity),
    });

    const { transactionHash } = await sendTransaction({ transaction, account });

    return NextResponse.json({
      message: `✅ ${quantity} unités du tokenId ${tokenId} envoyées à ${to}`,
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
