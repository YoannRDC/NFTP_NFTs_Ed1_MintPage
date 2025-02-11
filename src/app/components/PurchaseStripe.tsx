"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CreditCardForm from "./CreditCardForm";
import { ConnectButton } from "thirdweb/react";
import { accountAbstraction, client } from "../constants";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PurchasePage() {
  const buyerWalletAddress = useAddress();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      const response = await fetch("/api/stripe-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerWalletAddress }),
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Error creating payment intent:", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
        <div className="flex justify-center m-10">
            <ConnectButton client={client} accountAbstraction={accountAbstraction} locale="fr_FR"/>
        </div>

      {!clientSecret ? (
        <button
          onClick={handlePayment}
          className="px-6 py-3 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition"
        >
          Buy with Credit Card
        </button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CreditCardForm />
        </Elements>
      )}
    </div>
  );
}
function useAddress() {
    throw new Error("Function not implemented.");
}

