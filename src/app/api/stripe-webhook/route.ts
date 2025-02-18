// src/app/api/stripe-webhook/route.ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ethers } from "ethers";

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

      const POLYGON_RPC_URL = `https://137.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`;
      console.log("POLYGON_RPC_URL:", POLYGON_RPC_URL);
      const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY_MINTER as string, provider);

      // Initialize the SDK with the signer to allow transaction signing
      const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.PRIVATE_KEY_MINTER as string,
        "polygon",
        { secretKey: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID }
      );

      const contract = await sdk.getContract(nftContractAddress);

      /* TEST: Create an ethers.Contract instance for a static call */
      const rawContract = new ethers.Contract(
        nftContractAddress,
        // Replace 'contractInstance.abi' with 'contract.abi'
        // If contract.abi is unavailable, supply the ABI manually.
        contract.abi,
        // Use the same signer or a new one as needed.
        new ethers.Wallet(
          process.env.PRIVATE_KEY_MINTER as string,
          new ethers.providers.JsonRpcProvider(
            `https://137.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`
          )
        )
      );

      try {
        const result = await rawContract.callStatic.claimTo(buyerWalletAddress, 1);
        console.log("Static call result:", result);
      } catch (staticError) {
        console.error("Static call error:", staticError);
      }
      /* TEST END */

      const tx = await contract.erc721.claimTo(buyerWalletAddress, 1);
      console.log("NFT claimed successfully:", tx);
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
