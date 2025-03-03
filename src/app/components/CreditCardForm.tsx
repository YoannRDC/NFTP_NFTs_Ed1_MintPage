"use client";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import type { PaymentIntent } from "@stripe/stripe-js";

interface CreditCardFormProps {
  redirectPage: string; // par exemple "/nftp_ed1"
}

const CreditCardForm = ({ redirectPage }: CreditCardFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  // Construit l'URL de retour à partir du domaine et du chemin passé en prop
  const returnUrl = `https://www.authentart.com${redirectPage}`;

  const handlePayment = async () => {
    if (!stripe || !elements) {
      console.error("Stripe n'est pas configuré.");
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

      if ("paymentIntent" in result && result.paymentIntent) {
        const paymentIntent: PaymentIntent = result.paymentIntent;
        if (paymentIntent.status === "succeeded") {
          // Redirige vers la page avec le paramètre indiquant le succès
          window.location.href = `${returnUrl}?paymentResult=success`;
        } else {
          console.error("Paiement en attente ou incomplet :", paymentIntent.status);
          window.location.href = `${returnUrl}?paymentResult=error`;
        }
      } else if (result.error) {
        console.error("Erreur de paiement :", result.error);
        window.location.href = `${returnUrl}?paymentResult=error`;
      }
    } catch (err) {
      console.error("Erreur inattendue :", err);
      window.location.href = `${returnUrl}?paymentResult=error`;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded mx-auto" style={{ maxWidth: "400px" }}>
      <PaymentElement
        options={{
          appearance: {
            theme: "flat",
            variables: {
              colorBackground: "#ffffff",
              fontFamily: "Arial, sans-serif",
            },
          },
        } as any}
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
