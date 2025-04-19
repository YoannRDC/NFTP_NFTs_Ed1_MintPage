import { NextRequest, NextResponse } from "next/server";
import { setClaimConditionERC1155 } from "../ApiSetClaimConditionsERC1155";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tokenId = body.tokenId;

    if (typeof tokenId !== "number") {
      return NextResponse.json(
        { error: "Le paramètre 'tokenId' doit être un nombre." },
        { status: 400 }
      );
    }

    const txResult = await setClaimConditionERC1155({
      tokenId,
      contractAddress: "0x2d4108d38b19B8acC72B83B7Facb46dB0ECCe237",
      privateKey: process.env.PRIVATE_KEY_CADENART!,
      thirdwebSecretKey: process.env.THIRDWEB_API_SECRET_KEY!,
      chainId:"137",
      maxClaimableSupply: "100",
      maxClaimablePerWallet: "10",
      currency: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      price: "30",
      startDate: "2025-04-19T19:00:00",
      metadata: "ipfs://QmW82G6PvfRFbb17r1a125MaGMxHnEP3dA83xGs1Mr4Z4f/0",
      overrideList: [
        {
          address: "0x7b471306691dee8FC1322775a997E1a6CA29Eee1",
          maxClaimable: "10",
          price: "0",
        },
        {
          address: "0x70fB670E902904f7BE7A7fd455c792f0B0C5Bccb",
          maxClaimable: "10",
          price: "0",
        },
      ],
    });

    return NextResponse.json({
      message: `Claim conditions définies pour tokenId ${tokenId}`,
      transactionHash: txResult.transactionHash,
    });
  } catch (error: any) {
    console.error("Erreur :", error);
    return new NextResponse(
      JSON.stringify({
        error: { message: error.message, stack: error.stack },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
