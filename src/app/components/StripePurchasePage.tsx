"use client";
export const dynamic = "force-dynamic";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Elements } from "@stripe/react-stripe-js";
import CreditCardForm from "./CreditCardForm";
import { DistributionType, StripeMode } from "../constants";

// Définition des props attendues par StripePurchasePage, incluant le contrat, la page de retour
// et les nouveaux paramètres buyerWalletAddress et recipientWalletAddress
interface StripePurchasePageProps {
  projectName: string;
  distributionType: DistributionType;
  buyerWalletAddress: string;      // adresse du wallet acheteur
  recipientWalletAddressOrEmail: string;  // adresse du wallet destinataire
  contract: any;
  tokenId: bigint;
  requestedQuantity: bigint;
  paymentPriceFiat: number; // montant en centimes
  redirectPage: string;
  stripeMode: StripeMode;
  offererName: string;
}

export default function StripePurchasePage({
  projectName,
  distributionType,
  buyerWalletAddress,
  recipientWalletAddressOrEmail,
  contract,
  tokenId,
  requestedQuantity,
  paymentPriceFiat,
  stripeMode,
  redirectPage, 
  offererName,
}: StripePurchasePageProps) {
  
  console.log("StripePurchasePage called");
  const [clientSecret, setClientSecret] = useState<string>("");

  // Choix de la clé publishable en fonction du mode
  const stripePublishableKey =
    stripeMode === StripeMode.Live
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE!
      : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST!;

  // Chargement de Stripe avec la clé correspondante
  const stripePromise = loadStripe(stripePublishableKey);

  // Fonction pour récupérer le clientSecret depuis l'API Stripe
  const handleOnClick = async () => {
    try {
      const response = await fetch("/api/stripe-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          distributionType: distributionType.toString(),
          buyerWalletAddress: buyerWalletAddress,
          recipientWalletAddressOrEmail: recipientWalletAddressOrEmail,
          nftContractAddress: contract?.address,
          blockchainId: contract.chain.id.toString(),
          tokenId: tokenId.toString(), 
          requestedQuantity: requestedQuantity.toString(),
          paymentPriceFiat: paymentPriceFiat.toString(),
          stripeMode: stripeMode.toString(),
          offererName:offererName,
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
