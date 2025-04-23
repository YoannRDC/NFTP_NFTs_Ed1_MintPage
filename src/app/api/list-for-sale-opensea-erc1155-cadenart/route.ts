import { NextRequest, NextResponse } from "next/server";
import { Seaport } from "@opensea/seaport-js";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenAddress, tokenId, priceInEth, adminCode } = body;

    if (adminCode !== process.env.ADMIN_CODE) {
      return NextResponse.json({ error: "Code d'autorisation invalide" }, { status: 403 });
    }

    const PRIVATE_KEY = process.env.PRIVATE_KEY_CADENART!;
    const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY_CADENART!;
    // const RPC_URL = process.env.THIRDWEB_POLYGON_MAINNET_RPC_URL!;
    const RPC_URL = "https://polygon-rpc.com"
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const seaport = new Seaport(wallet);

    const offerer = await wallet.getAddress();
    console.log("👛 Wallet backend utilisé :", offerer);

    const price = ethers.parseEther(priceInEth.toString()); // bigint

    const now = Math.floor(Date.now() / 1000);
    const end = now + 90 * 24 * 60 * 60; // 90 jours

    const contract = new ethers.Contract(tokenAddress, [
      "function balanceOf(address, uint256) view returns (uint256)"
    ], provider);
    
    const balance = await contract.balanceOf(offerer, tokenId);
    console.log("🧪 Balance test:", balance.toString());
    

    const { executeAllActions } = await seaport.createOrder({
      offer: [
        {
          itemType: 2, // 2 = ERC1155
          token: tokenAddress,
          identifier: tokenId.toString(),
          amount: "1",
        },
      ],
      consideration: [
        {
          amount: price.toString(),
          recipient: offerer,
        },
        {
          amount: ((price * 25n) / 1000n).toString(), // 2.5% OpenSea fee
          recipient: "0x0000a26b00c1F0DF003000390027140000fAa719",
        },
      ],
      endTime: end,
      startTime: now,
      zone: "0x0000000000000000000000000000000000000000",
      conduitKey: "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
    });

    const order = await executeAllActions(); // signature, parameters

    const openseaResponse = await fetch("https://api.opensea.io/api/v2/orders/matic/seaport/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": OPENSEA_API_KEY,
      },
      body: JSON.stringify({
        parameters: order.parameters,
        signature: order.signature,
        protocol_address: "0x0000000000000068f116a894984e2db1123eb395",
      }),
    });

    const result = await openseaResponse.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Erreur :", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
