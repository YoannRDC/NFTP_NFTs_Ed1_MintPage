import { NextRequest, NextResponse } from "next/server";
import { Seaport } from "@opensea/seaport-js";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenAddress, tokenId, adminCode } = body;

    if (adminCode !== process.env.ADMIN_CODE) {
      return NextResponse.json({ error: "Code d'autorisation invalide" }, { status: 403 });
    }

    const PRIVATE_KEY = process.env.PRIVATE_KEY_CADENART!;
    const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY_CADENART!;
    const RPC_URL = "https://polygon-rpc.com";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const address = await wallet.getAddress();
    const seaport = new Seaport(wallet);

    // Étape 1 : Récupérer les orderHashes à partir de tokenAddress et tokenId
    const ordersResponse = await fetch(
      `https://api.opensea.io/api/v2/orders/matic/seaport/listings?asset_contract_address=${tokenAddress}&token_ids=${tokenId}&maker=${address}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": OPENSEA_API_KEY,
        },
      }
    );

    if (!ordersResponse.ok) {
      const errorData = await ordersResponse.json();
      return NextResponse.json({ error: errorData }, { status: ordersResponse.status });
    }

    const ordersData = await ordersResponse.json();
    const orderHashes = ordersData.orders.map((order: any) => order.order_hash);

    if (orderHashes.length === 0) {
      return NextResponse.json({ error: "Aucun ordre trouvé à annuler." }, { status: 404 });
    }

    // Étape 2 : Annuler les ordres via Seaport
    const cancelResult = seaport.cancelOrders(orderHashes);

    return NextResponse.json({ success: true, cancelResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}