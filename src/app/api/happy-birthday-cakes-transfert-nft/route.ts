import { NextRequest, NextResponse } from "next/server";
import { distributeNFT } from "../ApiRequestDistribution";
import { initializeThirdwebClient } from "../ApiPaymentReception";
import { PaymentMetadata } from "../PaymentMetadata";
import { DistributionType, projectMappings } from "@/app/constants";
import { markNFTAsDownloaded } from "../ApiEmailCodes";
import { createClient } from "redis";

export const dynamic = "force-dynamic";

const redis =  await createClient({ url: process.env.REDIS_URL }).connect();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, giftedWalletAddress, tokenId } = body;

    if (!code || !giftedWalletAddress || !tokenId) {
      return NextResponse.json({ error: "Code ou adresse manquant." }, { status: 400 });
    }

    const redisKey = `nft_code:${code}`;
    const codeDataRaw = await redis.get(redisKey);

    if (!codeDataRaw) {
      return NextResponse.json({ error: "Code invalide." }, { status: 400 });
    }

    const codeData = JSON.parse(codeDataRaw);

    if (codeData.downloaded) {
      return NextResponse.json({ error: "Code déjà utilisé." }, { status: 400 });
    }

    const client = initializeThirdwebClient();
    if (client instanceof NextResponse) {
      return client;
    }

    const paymentMetadata: PaymentMetadata = {
      projectName: "HAPPYBIRTHDAYCAKES",
      distributionType: DistributionType.EmailCode,
      buyerWalletAddress: "",
      recipientWalletAddressOrEmail: giftedWalletAddress,
      nftContractAddress: projectMappings.HAPPYBIRTHDAYCAKES.contractAddress,
      blockchainId: projectMappings.HAPPYBIRTHDAYCAKES.blockchain.id.toString(),
      tokenId: tokenId,
      requestedQuantity: "1",
      paymentPriceFiat: "0",
      offererName: "",
    };

    const result = await distributeNFT(client, paymentMetadata);

    if (result.transaction) {
      // codeData.downloaded = true;
      // await redisClient.set(code, JSON.stringify(codeData));

      const updated = await markNFTAsDownloaded(code);
      if (!updated) {
        console.error("Erreur lors de la mise à jour du statut du code dans la base Redis.");
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Échec de la distribution." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Erreur serveur dans transfert NFT :", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
