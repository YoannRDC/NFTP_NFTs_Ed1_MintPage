"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import type { PaymentIntent } from "@stripe/stripe-js";

const CreditCardForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const returnUrl = "https://www.authentart.com/api/stripe-webhook";

  const handlePayment = async () => {
    if (!stripe || !elements) {
      console.log("Stripe is not configured.");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if ('paymentIntent' in result && result.paymentIntent) {
        const paymentIntent: PaymentIntent = result.paymentIntent;

        if (paymentIntent.status === "succeeded") {
          alert("Paiement réussi ! Votre NFT sera bientôt livré à votre wallet.");
        } else {
          console.log("Paiement en attente ou incomplet :", paymentIntent.status);
        }
      } else if (result.error) {
        console.error("Erreur de paiement :", result.error);
        alert(`Erreur de paiement : ${result.error.message}`);
      }
    } catch (err) {
      console.error("Erreur inattendue :", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded mx-auto" style={{ maxWidth: "400px" }}>
      <PaymentElement
        options={
          {
            appearance: {
              theme: "flat",
              variables: {
                colorBackground: "#ffffff",
                fontFamily: "Arial, sans-serif",
              },
            },
          } as any
        }
      />

      <button
        onClick={handlePayment}
        disabled={!stripe || isProcessing}
        className="px-6 py-3 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition mt-5"
      >
        {isProcessing ? "Traitement en cours..." : "Payer maintenant"}
      </button>
    </div>
  );
};

export default CreditCardForm;
