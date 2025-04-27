import { NextRequest, NextResponse } from "next/server";
import { distributeNFT } from "../ApiRequestDistribution";
import { initializeThirdwebClient } from "../ApiPaymentReception";
import { PaymentMetadata } from "../PaymentMetadata";
import { DistributionType, projectMappings } from "@/app/constants";
import fs from 'fs/promises';
import path from 'path';
import { markNFTAsDownloaded } from "../ApiEmailCodes";

export const dynamic = "force-dynamic";

const FILE_PATH = path.join(process.cwd(), 'data', 'emailCodes.json'); // <-- Pour lire les codes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, giftedWalletAddress, tokenId } = body;

    if (!code || !giftedWalletAddress || !tokenId) {
      return NextResponse.json({ error: "Code ou adresse manquant." }, { status: 400 });
    }

    // Vérification du code
    let allCodes: any[] = [];
    try {
      const raw = await fs.readFile(FILE_PATH, 'utf-8');
      allCodes = JSON.parse(raw) as any[];
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return NextResponse.json({ error: "Aucun code enregistré." }, { status: 400 });
      }
      throw err;
    }

    const matchingCode = allCodes.find(r => r.code === code);
    if (!matchingCode) {
      return NextResponse.json({ error: "Code invalide." }, { status: 400 });
    }
    if (matchingCode.downloaded) {
      return NextResponse.json({ error: "Code déjà utilisé." }, { status: 400 });
    }

    // Initialisation du client Thirdweb
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
      const updated = await markNFTAsDownloaded(code);
      if (!updated) {
        console.error("Erreur lors de la mise à jour du statut du code.");
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
