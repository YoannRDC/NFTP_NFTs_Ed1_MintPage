// src/app/components/PurchasePage.tsx

"use client";
export const dynamic = "force-dynamic";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { nftpNftsEd1Contract } from "../constants";
import { Elements } from "@stripe/react-stripe-js";
import CreditCardForm from "./CreditCardForm";

// Définition des props attendues par PurchasePage
interface PurchasePageProps {
  requestedQuantity: bigint;
  amount: number; // montant en centimes
  stripeMode: "test" | "live";
}

export default function PurchasePage({
  requestedQuantity,
  amount,
  stripeMode,
}: PurchasePageProps) {
  const smartAccount = useActiveAccount();
  const [clientSecret, setClientSecret] = useState<string>("");

  // Choix de la clé publishable en fonction du mode
  const stripePublishableKey =
    stripeMode === "live"
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
          buyerWalletAddress: smartAccount?.address,
          nftContractAddress: nftpNftsEd1Contract?.address,
          blockchainId: nftpNftsEd1Contract.chain.toString(),
          requestedQuantity: requestedQuantity.toString(),
          amount: amount.toString(),
          stripeMode: stripeMode.toString(),
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
          <CreditCardForm />
        </Elements>
      )}
    </div>
  );
}
