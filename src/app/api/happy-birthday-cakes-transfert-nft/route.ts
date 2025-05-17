import { NextRequest, NextResponse } from "next/server";
import { distributeNFT } from "../ApiRequestDistribution";
import { initializeThirdwebClient } from "../ApiPaymentReception";
import { PaymentMetadata } from "../PaymentMetadata";
import { DistributionType, projectMappings, TransactionStatus } from "@/app/constants";
import { createClient } from "redis";
import { updateNFTtxStatus } from "../ApiEmailCodes"; // assure-toi que c’est bien exporté

export const dynamic = "force-dynamic";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentTxHash, code, giftedWalletAddress, tokenId } = body;

    if (!paymentTxHash || !code || !giftedWalletAddress || !tokenId) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    const redisKey = `nft_tx:${paymentTxHash}`;
    const codeDataRaw = await redis.get(redisKey);

    if (!codeDataRaw) {
      return NextResponse.json({ error: "Transaction inconnue." }, { status: 400 });
    }

    const codeData = JSON.parse(codeDataRaw);

    if (codeData.status === TransactionStatus.NFT_DOWNLOADED) {
      return NextResponse.json({ error: "Ce NFT a déjà été téléchargé." }, { status: 400 });
    }

    const client = initializeThirdwebClient();
    if (client instanceof NextResponse) {
      return client;
    }

    const paymentMetadata: PaymentMetadata = {
      projectName: "HAPPYBIRTHDAYCAKES",
      distributionType: DistributionType.ClaimToERC1155,
      buyerWalletAddress: "",
      recipientWalletAddressOrEmail: giftedWalletAddress,
      nftContractAddress: projectMappings.HAPPYBIRTHDAYCAKES.contractAddress,
      blockchainId: projectMappings.HAPPYBIRTHDAYCAKES.blockchain.id.toString(),
      tokenId: tokenId,
      requestedQuantity: "1",
      paymentPriceFiat: "0",
      offererName: codeData.offererName || "",
    };

    const result = await distributeNFT(client, paymentMetadata);

    if (result.transaction) {
      const updated = await updateNFTtxStatus(paymentTxHash, TransactionStatus.NFT_DOWNLOADED);
      if (!updated) {
        console.error("⚠️ Impossible de mettre à jour le statut NFT_DOWNLOADED dans Redis.");
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Échec de la distribution du NFT." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("❌ Erreur serveur transfert NFT :", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
