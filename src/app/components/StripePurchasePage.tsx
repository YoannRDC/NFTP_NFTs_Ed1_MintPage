"use client";
export const dynamic = "force-dynamic";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Elements } from "@stripe/react-stripe-js";
import CreditCardForm from "./CreditCardForm";
import { DistributionType } from "../constants";

// Définition des props attendues par StripePurchasePage, incluant le contrat et la page de retour
interface StripePurchasePageProps {
  projectName: string;
  contract: any;
  distributionType: DistributionType;
  tokenId: bigint;
  requestedQuantity: bigint;
  paymentPriceFiat: number; // montant en centimes
  stripeMode: "test" | "live";
  redirectPage: string;
}

export default function StripePurchasePage({
  projectName,
  contract,
  distributionType: distributionType,
  redirectPage,
  tokenId,
  requestedQuantity,
  paymentPriceFiat: paymentPriceFiat,
  stripeMode,
}: StripePurchasePageProps) {
  
  console.log("StripePurchasePage called");
  const smartAccount = useActiveAccount();
  const [clientSecret, setClientSecret] = useState<string>("");

  // Choix de la clé publishable en fonction du mode
  const stripePublishableKey =
    stripeMode === "live"
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE!
      : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST!;

  // Chargement de Stripe avec la clé correspondante
  const stripePromise = loadStripe(stripePublishableKey);

  console.log("smartAccount?.address: ", smartAccount?.address);
  console.log("contract?.address: ", contract?.address);
  console.log("contract.chain.id.toString(): ", contract.chain.id.toString());
  console.log("requestedQuantity.toString(): ", requestedQuantity.toString());
  console.log("amount.toString(): ", paymentPriceFiat.toString());
  console.log("stripeMode.toString(): ", stripeMode.toString());
  console.log("contractType.toString(): ", distributionType.toString());
  console.log("tokenId.toString(): ", tokenId.toString());
  console.log("projectName: ", projectName);

  // Fonction pour récupérer le clientSecret depuis l'API Stripe
  const handleOnClick = async () => {
    try {
      const response = await fetch("/api/stripe-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerWalletAddress: smartAccount?.address,
          recipientWalletAddress: smartAccount?.address,
          nftContractAddress: contract?.address,
          blockchainId: contract.chain.id.toString(),
          requestedQuantity: requestedQuantity.toString(),
          paymentPriceFiat: paymentPriceFiat.toString(),
          stripeMode: stripeMode.toString(),
          contractType: distributionType.toString(),
          tokenId: tokenId.toString(), 
          projectName,
        }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la création du client secret");
      }
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Erreur lors de la récupération du client secret :", error);
    }
  };

  return (
    <div>
      {!clientSecret ? (
        <button onClick={handleOnClick} className="px-4 py-2 bg-blue-500 text-white rounded">
          Acheter en euros
        </button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CreditCardForm redirectPage={redirectPage} />
        </Elements>
      )}
    </div>
  );
}
