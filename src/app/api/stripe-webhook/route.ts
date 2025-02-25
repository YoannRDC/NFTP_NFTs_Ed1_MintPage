// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import contractABI from "../../../../contracts/contract_NFTP_ed1_ABI.json";
import { getActiveClaimCondition } from "thirdweb/extensions/erc721";
import { nftpNftsEd1Contract } from "@/app/constants";

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

      try {
        const sdk = ThirdwebSDK.fromPrivateKey(
          process.env.PRIVATE_KEY_MINTER as string,
          "polygon",
          { secretKey: process.env.THIRDWEB_API_SECRET_KEY }
        );

        // Utiliser l'ABI pour récupérer le contrat en mode "custom"
        const nftContract = await sdk.getContract(nftContractAddress, contractABI);
        // console.log("Instance du contrat récupérée:", nftContract);

        // Paramètres pour la fonction claim
        const receiver = buyerWalletAddress;
        const quantity = 1n;
        const currency = "0x0000000000000000000000000000000000000000"; // adresse de la monnaie native
        const pricePerToken = 0; // paiement déjà effectué via Stripe
        const allowlistProof = { proof: [], maxQuantityInAllowlist: 0 }; // paramètres vides si non utilisés
        const data = "0x"; // données vides

        console.log("bef getActiveClaimCondition");
        console.log("nftContractAddress", nftContractAddress);

        const nftDropContract = sdk.getContract(nftContractAddress, "nft-drop");
        
        console.log("nftDropContract.getAddress()", (await nftDropContract).getAddress());
        console.log("nftDropContract.totalClaimedSupply", (await nftDropContract).totalClaimedSupply);
        console.log("nftDropContract.chainId", (await nftDropContract).chainId);
        console.log("nftDropContract.owner", (await nftDropContract).owner);
        console.log("nftDropContract.getAllClaimed", (await nftDropContract).getAllClaimed());
        const activeClaimCondition = await (await nftDropContract).claimConditions.getActive();
        
        console.log("activeClaimCondition:", activeClaimCondition);

        const claimToOptions = {
          pricePerToken: activeClaimCondition.price.toString(),
          currencyAddress: activeClaimCondition.currencyAddress
        };

        console.log("claimToOptions:", claimToOptions);
        const tx = await nftContract.erc721.claimTo(buyerWalletAddress, 1, claimToOptions);
        console.error("tx:", tx);

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
