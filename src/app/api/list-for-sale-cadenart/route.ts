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
    const { tokenId, quantity, to, adminCode } = body;

    // 🔐 Sécurité : vérifie le code admin
    const expectedCode = process.env.ADMIN_CODE;
    if (adminCode !== expectedCode) {
      return NextResponse.json({ error: "Code d'autorisation invalide." }, { status: 403 });
    }

    if (!tokenId || !quantity || !to) {
      return NextResponse.json({ error: "Champs manquants (tokenId, amount, to)." }, { status: 400 });
    }

    const NFT_CONTRACT_ADDRESS = "0x2d4108d38b19B8acC72B83B7Facb46dB0ECCe237"; // ERC-1155
    const PRIVATE_KEY = process.env.PRIVATE_KEY_CADENART!;
    const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_API_SECRET_KEY!;
    const CHAIN_ID = process.env.CHAIN_ID || "137";

    const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
    const chain = defineChain(Number(CHAIN_ID));
    const contract = getContract({ client, chain, address: NFT_CONTRACT_ADDRESS });
    const account = privateKeyToAccount({ client, privateKey: PRIVATE_KEY });

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
    console.error("Erreur lors du claimTo :", error);
    return new NextResponse(
      JSON.stringify({
        error: { message: error.message, stack: error.stack },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
