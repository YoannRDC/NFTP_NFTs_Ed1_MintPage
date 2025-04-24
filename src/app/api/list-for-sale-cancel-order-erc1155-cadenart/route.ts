import { NextRequest, NextResponse } from "next/server";
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

    // Étape 1 : Récupérer les ordres COMPLETS depuis OpenSea
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

    // Étape 2 : Générer les signatures EIP712 d'annulation puis envoyer explicitement à OpenSea
    const cancelResponses = await Promise.all(ordersData.orders.map(async (order: any) => {
      const domain = order.protocol_data.domain;
      const types = { OrderComponents: order.protocol_data.types.OrderComponents };
      const value = order.protocol_data.parameters;

      // Signature EIP712 d'annulation
      const signature = await wallet.signTypedData(domain, types, value);

      // Appel API REST OpenSea pour annuler explicitement l'ordre
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
