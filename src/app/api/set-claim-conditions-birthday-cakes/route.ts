// app/api/setClaimConditions/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createThirdwebClient,
  defineChain,
  getContract,
  prepareContractCall,
  sendTransaction,
  toWei,
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { polygon } from "thirdweb/chains";

export async function POST(req: NextRequest) {
  try {
    // Récupération des variables d'environnement
    const CONTRACT_ADDRESS = "0xc58b841A353ab2b288d8C79AA1F3307F32f77cbf";
    const THIRDWEB_API_SECRET_KEY = process.env.THIRDWEB_API_SECRET_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY_BIRTHDAY_CAKES;
    // Par défaut, on utilise la chaîne Polygon (id 137)
    const CHAIN_ID = process.env.CHAIN_ID || "137";

    if (!CONTRACT_ADDRESS || !THIRDWEB_API_SECRET_KEY || !PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // Création du client Thirdweb via la secret key
    const client = createThirdwebClient({ secretKey: THIRDWEB_API_SECRET_KEY });
    console.log("Client créé avec l'id :", client.clientId);

    // Définition de la chaîne
    const chain = defineChain(Number(CHAIN_ID));

    // Récupération du contrat NFT sur la chaîne spécifiée
    const nftContract = getContract({
      client,
      chain,
      address: CONTRACT_ADDRESS,
    });

    // Création du compte temporaire à partir de la clé privée
    const account = privateKeyToAccount({ client, privateKey: PRIVATE_KEY });

    // Constante représentant la valeur "unlimited" pour un uint256
    const UNLIMITED = BigInt(
      "9999999999"
    );

    // Préparation de la metadata pour l'allowList
    const allowListMetadata = JSON.stringify({
      allowList: [
        {
          address: "0x7b471306691dee8FC1322775a997E1a6CA29Eee1",
          maxClaimable: 10,
          price: "0",
          currencyAddress: "0x0000000000000000000000000000000000000000",
        },
      ],
    });

    // Définition des claim conditions avec les types attendus (bigint pour les valeurs numériques)
    const conditions = [
      {
        startTimestamp: BigInt(Math.floor(Date.now() / 1000)), // timestamp en secondes
        maxClaimableSupply: UNLIMITED, // valeur "unlimited"
        supplyClaimed: 0n, // aucun NFT déjà claimé
        quantityLimitPerWallet: UNLIMITED, // pas de limite par wallet
        merkleRoot:
          "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
        pricePerToken: toWei("100"), // 100 POL converti en wei (bigint)
        currency: "0x0000000000000000000000000000000000000000",
        metadata: allowListMetadata, // informations d'allowList encodées en JSON
      },
    ];

    const resetClaimEligibility = true;

    // Tableau pour collecter les résultats de chaque transaction
    const results: { tokenId: bigint; transactionHash: string }[] = [];

    // Boucle sur les tokenIds de 0 à 122
    for (let tokenId = 0; tokenId <= 3; tokenId++) {
      console.log(`Définition des conditions de claim pour tokenId: ${tokenId}`);
      // Conversion de tokenId en bigint pour respecter le type attendu
      const tokenIdBig = BigInt(tokenId);

      const transaction = prepareContractCall({
          contract: nftContract,
          method: "function setClaimConditions(uint256 _tokenId, (uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)",
          params: [tokenIdBig, conditions, resetClaimEligibility],
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account,
      });

      results.push({ tokenId: tokenIdBig, transactionHash });
      console.log(
        `Transaction envoyée pour tokenId ${tokenId}: ${transactionHash}`
      );
    }

    return NextResponse.json({
      message: "Claim conditions définies pour tous les tokens",
      results,
    });
  } catch (error: any) {
    console.error("Erreur lors de la définition des claim conditions :", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
