import { NextRequest, NextResponse } from "next/server";
import {
  createThirdwebClient,
  defineChain,
  getContract,
  sendTransaction,
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { createListing } from "thirdweb/extensions/marketplace";

export async function POST(req: NextRequest) {
  
    try {
      const body = await req.json();
      const { tokenId, quantity, price, adminCode } = body;

      // 🔐 Sécurité : vérifie le code admin
      const expectedCode = process.env.ADMIN_CODE;
      if (adminCode !== expectedCode) {
        return NextResponse.json({ error: "Code d'autorisation invalide." }, { status: 403 });
      }
  
      if (
        typeof tokenId !== "number" ||
        typeof quantity !== "number" ||
        typeof price !== "number"
      ) {
        return NextResponse.json(
          { error: "Les champs 'tokenId', 'quantity' et 'price' doivent être des nombres." },
          { status: 400 }
        );
      }
  
      const NFT_CONTRACT_ADDRESS = "0x2d4108d38b19B8acC72B83B7Facb46dB0ECCe237";
      const MARKETPLACE_ADDRESS = "0x0000000000000068f116a894984e2db1123eb395";
      const PRIVATE_KEY = process.env.PRIVATE_KEY_CADENART!;
      const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_API_SECRET_KEY!;
      const CHAIN_ID = process.env.CHAIN_ID || "137";
  
      const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
      const chain = defineChain(Number(CHAIN_ID));
      const marketplace = getContract({ client, chain, address: MARKETPLACE_ADDRESS });
      const account = privateKeyToAccount({ client, privateKey: PRIVATE_KEY });
  
      const transaction = createListing({
        contract: marketplace,
        assetContractAddress: NFT_CONTRACT_ADDRESS,
        tokenId: BigInt(tokenId),
        quantity: BigInt(quantity),
        pricePerToken: price.toString(),
      });
  
      const txResult = await sendTransaction({ transaction, account });
  
      if (!txResult || !txResult.transactionHash) {
        return NextResponse.json(
          { error: "Transaction échouée ou hash manquant." },
          { status: 500 }
        );
      }
  
      // ✅ Ici on retourne bien un NextResponse en cas de succès
      return NextResponse.json({
        message: `NFT listé en vente avec succès pour tokenId ${tokenId}`,
        transactionHash: txResult.transactionHash,
      });
  
    } catch (error: any) {
      console.error("Erreur lors de la mise en vente :", error);
      return new NextResponse(
        JSON.stringify({
          error: { message: error.message, stack: error.stack },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  