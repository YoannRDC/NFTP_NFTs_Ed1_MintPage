// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import contractABI from "../../../../contracts/contract_NFTP_ed1_ABI.json";
import { claimTo, getActiveClaimCondition } from "thirdweb/extensions/erc721";
import { ContractOptions } from "thirdweb/contract";
import { sendTransaction } from "thirdweb";
import { Wallet } from "thirdweb/wallets";

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

      const transaction = claimTo({
        contract: nftContractAddress,
        to: buyerWalletAddress,
        quantity: 1n,
        from: "0x6debf5C015f0Edd3050cc919A600Fb78281696B9", // address of the one claiming
      });
      console.log("NFT claimed successfully:", transaction);

      const txRes = sendTx({ transaction });

      console.log("txRes:", txRes); 


/*       const dropContract = await sdk.getContract(nftContractAddress, "nft-drop");
      const activeClaimCondition = await dropContract.claimConditions.getActive();

      const claimToOptions = {
        pricePerToken: activeClaimCondition.price.toString(),
        currencyAddress: activeClaimCondition.currencyAddress
      };

      const tx = await contract.erc721.claimTo(buyerWalletAddress, 1, claimToOptions);
      console.log("NFT claimed successfully:", tx); */
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Erreur lors de la construction de l'événement:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}

function sendTx(arg0: { transaction: import("thirdweb").PreparedTransaction<any, import("abitype").AbiFunction, import("thirdweb").PrepareTransactionOptions>; }) {
  throw new Error("Function not implemented.");
}
