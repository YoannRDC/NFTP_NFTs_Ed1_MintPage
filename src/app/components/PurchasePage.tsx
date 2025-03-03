"use client";
export const dynamic = "force-dynamic";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Elements } from "@stripe/react-stripe-js";
import CreditCardForm from "./CreditCardForm";

// Définition des props attendues par PurchasePage, incluant le contrat et la page de retour
interface PurchasePageProps {
  requestedQuantity: bigint;
  amount: number; // montant en centimes
  stripeMode: "test" | "live";
  contract: any;
  contractType: "erc721drop" | "erc721collection" | "erc1155drop" | "erc1155edition";
  redirectPage: string; // chemin de la page de retour (ex: "/nftp_ed1")
  tokenId: bigint;
}

export default function PurchasePage({
  requestedQuantity,
  amount,
  stripeMode,
  contract,
  contractType,
  redirectPage,
  tokenId
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
          nftContractAddress: contract?.address,
          blockchainId: contract.chain.id.toString(),
          requestedQuantity: requestedQuantity.toString(),
          amount: amount.toString(),
          stripeMode: stripeMode.toString(),
          contractType: contractType.toString(),
          tokenId: tokenId.toString(), 
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
