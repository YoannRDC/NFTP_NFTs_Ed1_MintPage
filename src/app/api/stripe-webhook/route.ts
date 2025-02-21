// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ethers } from "ethers";
import contractABI from "../../../../contracts/contract_NFTP_ed1_ABI.json";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const stripeSignature = req.headers.get("stripe-signature");

  console.log("Webhook called");

  if (!stripeSignature) {
    console.log("invalid stripe-signature");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST as string, {
    apiVersion: "2025-01-27.acacia",
  });

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (event.type === "charge.succeeded") {
      const paymentIntent = event.data.object as any;
      const buyerWalletAddress = paymentIntent.metadata.buyerWalletAddress;
      console.log("buyerWalletAddress:", buyerWalletAddress);

      const nftContractAddress = paymentIntent.metadata.nftContractAddress;
      console.log("nftContractAddress:", nftContractAddress);

      console.log(" > charge.succeeded");

      if (!process.env.PRIVATE_KEY_MINTER) {
        console.log("missing PRIVATE_KEY_MINTER");
        return NextResponse.json({ error: "missing PRIVATE_KEY_MINTER" }, { status: 400 });
      }

      console.log(" > PRIVATE_KEY_MINTER -> OK");

      // Connexion au réseau Polygon via un RPC provider (ex: Infura, Alchemy)
      const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_POLYGON_MAINNET_RPC_URL);
      console.log(" > provider -> ", provider);
      // Création d'un wallet à partir de votre clé privée, avec le provider
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_MINTER, provider);
      console.log(" > wallet -> ", wallet.address);

      //console.log(" > contractABI -> ", contractABI);
      const contract = new ethers.Contract(nftContractAddress, contractABI, wallet);
      console.log(" > contract -> ", contract.address);

      try {
        // Remplacez l'appel à claimTo par l'appel à claim.
        // La fonction "claim" attend les paramètres suivants :
        // _receiver, _quantity, _currency, _pricePerToken, _allowlistProof, _data.
        // Ici, on suppose une réclamation d'1 NFT gratuitement.
        const tx = await contract.claim(
          buyerWalletAddress,                      // _receiver
          1,                                       // _quantity (1 NFT)
          ethers.constants.AddressZero,            // _currency (token natif, ex: MATIC)
          0,                                       // _pricePerToken (0 si gratuit)
          {                                        // _allowlistProof (aucune preuve nécessaire)
            proof: [],
            quantityLimitPerWallet: 1,
            pricePerToken: 0,
            currency: ethers.constants.AddressZero,
          },
          "0x"                                     // _data (données supplémentaires vides)
        );
        console.log(" > tx sent, waiting confirmation. Tx hash:", tx.hash);
        // Attente de la confirmation de la transaction
        await tx.wait();
        console.log("Claim réussi, tx hash:", tx.hash);
      } catch (error) {
        console.error("Erreur lors du claim:", error);
        return NextResponse.json({ message: "Erreur lors de l'exécution du claim" }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
