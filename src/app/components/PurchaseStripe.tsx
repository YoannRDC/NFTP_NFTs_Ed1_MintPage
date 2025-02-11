"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useAddress } from "@thirdweb-dev/react";
import { useState } from "react";
import { ConnectButton } from "thirdweb/react";
import { accountAbstraction, client } from "../constants";
import { Elements } from "@stripe/react-stripe-js";
import CreditCardForm from "./CreditCardForm";

// On initialise Stripe en dehors du composant pour éviter de le recréer à chaque rendu.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PurchasePage() {
  const buyerWalletAddress = useAddress();
  const [clientSecret, setClientSecret] = useState<string>("");

  // Fonction pour récupérer le clientSecret depuis l'API Stripe.
  const handleOnClick = async () => {
    try {
      const response = await fetch("/api/stripe-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerWalletAddress }),
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
    <main>
      <div className="flex justify-center m-10">
        <ConnectButton
          client={client}
          accountAbstraction={accountAbstraction}
          locale="fr_FR"
        />
      </div>

      {!clientSecret ? (
        <button onClick={handleOnClick} className="px-4 py-2 bg-blue-500 text-white rounded">
          Buy with credit card
        </button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CreditCardForm />
        </Elements>
      )}
    </main>
  );
}
