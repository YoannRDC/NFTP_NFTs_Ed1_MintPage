// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import contractABI from "../../../../contracts/contract_NFTP_ed1_ABI.json";
import { claimTo, getActiveClaimCondition } from "thirdweb/extensions/erc721";
import { ContractOptions } from "thirdweb/contract";
import { createThirdwebClient, defineChain, getContract, sendTransaction } from "thirdweb";
import { privateKeyToAccount, Wallet } from "thirdweb/wallets";

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
      
      if (!process.env.THIRDWEB_API_SECRET_KEY) {
        console.log("missing THIRDWEB_API_SECRET_KEY");
        return NextResponse.json({ error: "missing THIRDWEB_API_SECRET_KEY" }, { status: 400 });
      }
      
      const client = createThirdwebClient({
        // use `secretKey` for server side or script usage
        secretKey: process.env.THIRDWEB_API_SECRET_KEY,
      });
      console.log("client.clientId:", client.clientId);

      const nftContract = getContract({
        client,
        chain: defineChain(137),
        address: nftContractAddress,
        });

      const transaction = claimTo({
        contract: nftContract,
        to: buyerWalletAddress,
        quantity: 1n,
        from: "0x6debf5C015f0Edd3050cc919A600Fb78281696B9", // address of the one claiming
      });
      console.log("transaction:", transaction);

      if (!process.env.PRIVATE_KEY_MINTER) {
        console.log("missing PRIVATE_KEY_MINTER");
        return NextResponse.json({ error: "missing THIRDWEB_API_SECRET_KEY" }, { status: 400 });
      }
      console.log("valid process.env");

      const account = privateKeyToAccount({
        client,
        privateKey: process.env.PRIVATE_KEY_MINTER,
      });
      console.log("account.address:", account.address);

      const result = await sendTransaction({
        transaction,
        account,
      });
      console.log("result:", result); 
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
