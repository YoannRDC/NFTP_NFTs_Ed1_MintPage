"use client";

import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";

type MailchimpSubscriptionProps = {
  listId: string;
};

const MailchimpSubscription: React.FC<MailchimpSubscriptionProps> = ({ listId }) => {
  const account = useActiveAccount();
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  async function handleSubscribe() {
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    try {
      console.log("listId:", listId);
      console.log("subscriptionEmail:", subscriptionEmail);
      console.log("account?.address:", account?.address);
      const res = await fetch("/api/mailchimp/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subscriptionEmail,
          listId: listId,
          walletAddress: account?.address,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Au lieu d'afficher un message sous le formulaire, redirige la page avec le paramètre "subscriptionResult=success"
        window.location.href = window.location.pathname + "?subscriptionResult=success";
      } else {
        setSubscriptionError(
          data.error || "Erreur inconnue lors de l'inscription"
        );
      }
    } catch (error: any) {
      setSubscriptionError(error.message);
    }
    setSubscriptionLoading(false);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center">
      <input
        type="email"
        placeholder="Votre adresse email"
        value={subscriptionEmail}
        onChange={(e) => setSubscriptionEmail(e.target.value)}
        className="w-full sm:w-auto mr-0 sm:mr-4 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
      />
      <button
        onClick={handleSubscribe}
        className="mt-4 sm:mt-0 px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
        disabled={subscriptionLoading}
      >
        {subscriptionLoading ? "Inscription en cours..." : "Créer mon compte"}
      </button>
    </div>

  );
};

export default MailchimpSubscription;
