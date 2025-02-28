// src/app/components/PurchasePage.tsx

"use client";
export const dynamic = "force-dynamic";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { nftpNftsEd1Contract } from "../constants";
import { Elements } from "@stripe/react-stripe-js";
import CreditCardForm from "./CreditCardForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST!);

// Définition des props attendues par PurchasePage
interface PurchasePageProps {
  requestedQuantity: bigint;
}

export default function PurchasePage({ requestedQuantity }: PurchasePageProps) {
  const smartAccount = useActiveAccount();
  const [clientSecret, setClientSecret] = useState<string>("");

  // Fonction pour récupérer le clientSecret depuis l'API Stripe.
  const handleOnClick = async () => {
    try {
      const response = await fetch("/api/stripe-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerWalletAddress: smartAccount?.address,
          nftContractAddress: nftpNftsEd1Contract?.address,
          blockchainId: nftpNftsEd1Contract.chain,
          // Conversion du bigint en string pour la sérialisation JSON
          requestedQuantity: requestedQuantity.toString(),
        }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la création du client secret");
      }
      const data = await response.json();
      console.log("clientSecret:", clientSecret);
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Erreur lors de la récupération du client secret :", error);
    }
  };

  return (
    <div>
      {!clientSecret ? (
        <button onClick={handleOnClick} className="px-4 py-2 bg-blue-500 text-white rounded">
          Acheter en Euros
        </button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CreditCardForm />
        </Elements>
      )}
    </div>
  );
}
