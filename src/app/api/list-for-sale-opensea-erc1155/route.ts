import { NextRequest, NextResponse } from "next/server";
import { Seaport } from "@opensea/seaport-js";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenId, adminCode } = body;

    if (adminCode !== process.env.ADMIN_CODE) {
      return NextResponse.json({ error: "Code d'autorisation invalide" }, { status: 403 });
    }

    const priceInMatic = "1000" // !!!! Total en MATIC (saisir la somme des prix unitaires)
    const quantity= "10"
    const contractAddress = "0xc58b841a353ab2b288d8c79aa1f3307f32f77cbf"
    const PRIVATE_KEY = process.env.PRIVATE_KEY_BIRTHDAY_CAKES!;
    const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY_CADENART!;
    // const RPC_URL = process.env.THIRDWEB_POLYGON_MAINNET_RPC_URL!;
    const RPC_URL = "https://polygon-rpc.com"
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const address = await wallet.getAddress();
    const seaport = new Seaport(wallet);

    const price = ethers.parseUnits(priceInMatic.toString(), 18); // convert MATIC to wei
    //const now = Math.floor(Date.now() / 1000);
    const now = 1748353207;
    const end = now + 90 * 24 * 60 * 60;

    console.log("🕒 Date.now() =", now);
    console.log("🕒 end =", end);

    const conduitKey = "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000";
    const openseaFeeRecipient = "0x0000a26b00c1F0DF003000390027140000fAa719";

    // Récupérer le counter
    const seaportContract = new ethers.Contract(
      "0x0000000000000068f116a894984e2db1123eb395",
      ["function getCounter(address) view returns (uint256)"],
      provider
    );
    const counter = await seaportContract.getCounter(address);

    const priceInWei =  ((price * 995n) / 1000n).toString();
    const openseaFeesInWei =  ((price * 5n) / 1000n).toString();

    // Créer les paramètres
    const parameters = {
      offerer: address,
      offer: [
        {
          itemType: 3,
          token: contractAddress,
          identifier: tokenId.toString(),
          amount: quantity
        }
      ],
      consideration: [
        {
          itemType: 0, // 🟢 MATIC = native token
          token: "0x0000000000000000000000000000000000000000",
          identifier: "0",
          amount: priceInWei,
          recipient: address
        },
        {
          itemType: 0, // 🟢 MATIC = native token
          token: "0x0000000000000000000000000000000000000000",
          identifier: "0",
          amount: openseaFeesInWei,
          recipient: openseaFeeRecipient
        }
      ],
      startTime: now.toString(),
      endTime: end.toString(),
      orderType: 1,
      zone: "0x0000000000000000000000000000000000000000",
      zoneHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      salt: Date.now().toString(),
      conduitKey,
      totalOriginalConsiderationItems: 2,
      counter: counter.toString(),
      allowPartialFills: true
    };
    
    
    console.log("parameters:", parameters)

    // Générer la signature
    const order = await seaport.createOrder(parameters);
    const signedOrder = await order.executeAllActions();

    console.log("signedOrder.parameters:", signedOrder.parameters)
    console.log("signedOrder.signature:", signedOrder.signature)
    console.log("signedOrder.parameters:", signedOrder.parameters)

    // Appel à OpenSea API
    const response = await fetch("https://api.opensea.io/api/v2/orders/matic/seaport/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": OPENSEA_API_KEY
      },
      body: JSON.stringify({
        parameters: signedOrder.parameters,
        signature: signedOrder.signature,
        protocol_address: "0x0000000000000068f116a894984e2db1123eb395"
      })
    });

    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: result }, { status: response.status });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}