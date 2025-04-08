// src/app/api/set-claim-conditions-birthday-cakes/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createThirdwebClient,
  defineChain,
  getContract,
  sendTransaction,
		
} from "thirdweb";
import { setClaimConditions } from "thirdweb/extensions/erc1155";
import { privateKeyToAccount } from "thirdweb/wallets";

export async function POST(req: NextRequest) {
  try {
    // Récupération des variables d'environnement
    const CONTRACT_ADDRESS = "0xc58b841A353ab2b288d8C79AA1F3307F32f77cbf";
    const THIRDWEB_API_SECRET_KEY = process.env.THIRDWEB_API_SECRET_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY_BIRTHDAY_CAKES;
    // On utilise la chaîne Polygon (id 137)
    const CHAIN_ID = process.env.CHAIN_ID || "137";

    if (!CONTRACT_ADDRESS || !THIRDWEB_API_SECRET_KEY || !PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // Création du client Thirdweb
    const client = createThirdwebClient({ secretKey: THIRDWEB_API_SECRET_KEY });
    console.log("Client créé avec l'id:", client.clientId);

    const chain = defineChain(Number(CHAIN_ID));
    const nftContract = getContract({
      client,
      chain,
      address: CONTRACT_ADDRESS,
    });
		  
    const account = privateKeyToAccount({ client, privateKey: PRIVATE_KEY });
    console.log("Compte temporaire utilisé:", account.address);

    // Valeurs statiques à utiliser pour définir les conditions
    const maxClaimableSupply = "1000000";
    const maxClaimablePerWallet = "1000000";
    const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";   
    const price = "50"; // en POL
    const startDate = "2025-04-08T16:40:00"; // format ISO
    const metadata = "ipfs://QmW82G6PvfRFbb17r1a125MaGMxHnEP3dA83xGs1Mr4Z4f/0";

    // AllowList avec un seul élément
    const overrideList = [
      {
        address: "0x7b471306691dee8FC1322775a997E1a6CA29Eee1",
        maxClaimable: "1000000",
        price: "0",
      },
    ];

    // Exemple : envoi de la transaction pour tokenIds de 0 à 5 (adapter selon vos besoins)
    const results: { tokenId: bigint; transactionHash: string }[] = [];
																				  
    for (let tokenIdNum = 0; tokenIdNum <= 2; tokenIdNum++) {
      console.log(`Définition des conditions de claim pour tokenId: ${tokenIdNum}`);
      const tokenIdBig = BigInt(tokenIdNum);

      const transaction = setClaimConditions({
        contract: nftContract,
        tokenId: BigInt(tokenIdNum),
        phases: [
          {
            maxClaimableSupply: BigInt(maxClaimableSupply),
            maxClaimablePerWallet: BigInt(maxClaimablePerWallet),
            currencyAddress:currency,
            price: parseFloat(price),
            startTime: new Date(startDate),
            overrideList,
            metadata,
          },
        ],
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account,
      });

      results.push({ tokenId: tokenIdBig, transactionHash });
      console.log(`Transaction envoyée pour tokenId ${tokenIdNum}: ${transactionHash}`);
    }

    const serializedResults = results.map((item) => ({
      tokenId: item.tokenId.toString(),
      transactionHash: item.transactionHash,
    }));

    return NextResponse.json({
      message: "Claim conditions définies pour tous les tokens",
      results: serializedResults,
    });
  } catch (error: any) {
    console.error("Erreur lors de la définition des claim conditions :", error);
    const fullError = {
      message: error.message,
      stack: error.stack,
    };
    return new NextResponse(JSON.stringify({ error: fullError }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
