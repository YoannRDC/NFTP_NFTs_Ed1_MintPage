// src/app/api/stripe-webhook/route.ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
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
      const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
      console.log(" > provider -> ", provider.resolveName);
      // Création d'un wallet à partir de votre clé privée, avec le provider
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_MINTER, provider);
      console.log(" > wallet -> ", wallet.address);

      console.log(" > contractABI -> ", contractABI);
      const contract = new ethers.Contract(nftContractAddress, contractABI, wallet);
      console.log(" > contract -> ", contract.address);

      try {
        // Appel de la fonction claimTo du smart contract en lui passant l'adresse du wallet
        const tx = await contract.claimTo(buyerWalletAddress);
        console.log(" > tx -> ", tx.address);
        // Attente de la confirmation de la transaction
        await tx.wait();
        console.log("Claim réussi, tx hash:", tx.hash);
      } catch (error) {
        console.error("Erreur lors du claim:", error);
        return NextResponse.json({ message: "Erreur lors de l'exécution du claimTo" });
      }

    }

    /*
    if (event.type === "charge.succeeded") {
      const paymentIntent = event.data.object as any;
      const buyerWalletAddress = paymentIntent.metadata.buyerWalletAddress;
      console.log("buyerWalletAddress:", buyerWalletAddress);

      const nftContractAddress = paymentIntent.metadata.nftContractAddress;
      console.log("nftContractAddress:", nftContractAddress);

      // Initialiser le SDK avec le signer pour permettre de signer la transaction
      const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.PRIVATE_KEY_MINTER as string,
        "polygon",
        { secretKey: process.env.THIRDWEB_API_SECRET_KEY }
      );      

      const contract = await sdk.getContract(nftContractAddress);
      const tx = await contract.erc721.claimTo(buyerWalletAddress, 1);
      console.log("NFT claimed successfully:", tx);
    } */

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
