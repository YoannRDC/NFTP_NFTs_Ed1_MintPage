import { NextRequest, NextResponse } from "next/server";
import { setClaimConditionERC1155 } from "../ApiSetClaimConditionsERC1155";

export async function POST(req: NextRequest) {
    
  try {
    const body = await req.json();
    const { tokenId, adminCode } = body;

    // 🔐 Vérification du code secret
    const expectedCode = process.env.ADMIN_CODE;
    if (adminCode !== expectedCode) {
      return NextResponse.json(
        { error: "Code d'autorisation invalide." },
        { status: 403 }
      );
    }

    const txResult = await setClaimConditionERC1155({
      tokenId,
      contractAddress: "0xc58b841A353ab2b288d8C79AA1F3307F32f77cbf",
      privateKey: process.env.PRIVATE_KEY_BIRTHDAY_CAKES!,
      thirdwebSecretKey: process.env.THIRDWEB_API_SECRET_KEY!,
      chainId:"137",
      maxClaimableSupply: "1000000",
      maxClaimablePerWallet: "1000000",
      currency: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      price: "50",
      startDate: "2025-04-08T16:40:00",
      metadata: "ipfs://QmW82G6PvfRFbb17r1a125MaGMxHnEP3dA83xGs1Mr4Z4f/0",
      overrideList: [
        {
          address: "0x7b471306691dee8FC1322775a997E1a6CA29Eee1",
          maxClaimable: "1000000",
          price: "0",
        },
        {
          address: "0x7b471306691dee8FC1322775a997E1a6CA29Eee1",
          maxClaimable: "1000000",
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
