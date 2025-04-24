import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Type standard OpenSea Seaport OrderComponents pour EIP712
const orderComponentsType = {
  OrderComponents: [
    { name: "offerer", type: "address" },
    { name: "zone", type: "address" },
    { name: "offer", type: "OfferItem[]" },
    { name: "consideration", type: "ConsiderationItem[]" },
    { name: "orderType", type: "uint8" },
    { name: "startTime", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "zoneHash", type: "bytes32" },
    { name: "salt", type: "uint256" },
    { name: "conduitKey", type: "bytes32" },
    { name: "counter", type: "uint256" }
  ],
  OfferItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" }
  ],
  ConsiderationItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
    { name: "recipient", type: "address" }
  ]
};

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

    // Récupérer les ordres depuis OpenSea
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

    if (ordersData.orders.length === 0) {
      return NextResponse.json({ error: "Aucun ordre trouvé à annuler." }, { status: 404 });
    }

    const protocolAddress = "0x0000000000000068f116a894984e2db1123eb395";

    // Générer la signature d'annulation (EIP712)
    const cancelResponses = await Promise.all(ordersData.orders.map(async (order: any) => {
      const domain = order.protocol_data.domain;
      const value = order.protocol_data.parameters;

      const signature = await wallet.signTypedData(domain, orderComponentsType, value);

      const cancelResponse = await fetch(
        `https://api.opensea.io/api/v2/orders/matic/seaport/${protocolAddress}/${order.order_hash}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": OPENSEA_API_KEY,
          },
          body: JSON.stringify({ signature }),
        }
      );

      if (!cancelResponse.ok) {
        const errorResult = await cancelResponse.json();
        throw new Error(`Erreur OpenSea : ${cancelResponse.status} - ${JSON.stringify(errorResult)}`);
      }

      return cancelResponse.json();
    }));

    return NextResponse.json({ success: true, cancelResponses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
