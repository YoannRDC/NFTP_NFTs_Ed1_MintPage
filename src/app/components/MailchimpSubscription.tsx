"use client";

import React, { useState } from "react";

type MailchimpSubscriptionProps = {
  listId: string;
};

const MailchimpSubscription: React.FC<MailchimpSubscriptionProps> = ({ listId }) => {
  const [mailchimpData, setMailchimpData] = useState<any>(null);
  const [loadingMailchimp, setLoadingMailchimp] = useState(false);
  const [errorMailchimp, setErrorMailchimp] = useState<string | null>(null);
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<any>(null);

  async function handleMailchimpCall() {
    setLoadingMailchimp(true);
    setErrorMailchimp(null);
    try {
      const res = await fetch(`/api/mailchimp?listId=${listId}`);
      const data = await res.json();
      if (res.ok) {
        setMailchimpData(data);
        console.log("Réponse Mailchimp:", data);
      } else {
        setErrorMailchimp(data.error || "Erreur inconnue");
      }
    } catch (error: any) {
      setErrorMailchimp(error.message);
    }
    setLoadingMailchimp(false);
  }

  async function handleSubscribe() {
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    setSubscriptionSuccess(null);
    try {
      const res = await fetch("/api/mailchimp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subscriptionEmail,
          listId: listId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscriptionSuccess(data);
        console.log("Inscription réussie:", data);
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
    <div className="flex flex-col items-center mb-10 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Mailchimp Management</h2>

{/*       <button
        onClick={handleMailchimpCall}
        className="px-6 py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition mb-4"
        disabled={loadingMailchimp}
      >
        {loadingMailchimp ? "Chargement..." : "Tester Mailchimp API"}
      </button>
      {errorMailchimp && (
        <div className="text-center text-red-500 mb-2">{errorMailchimp}</div>
      )}
      {mailchimpData && (
        <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto max-h-64">
          {JSON.stringify(mailchimpData, null, 2)}
        </pre>
      )} */}

      <div className="flex flex-row items-center justify-center">
        <input
          type="email"
          placeholder="Votre adresse email"
          value={subscriptionEmail}
          onChange={(e) => setSubscriptionEmail(e.target.value)}
          className="mr-4 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />
        <button
          onClick={handleSubscribe}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
          disabled={subscriptionLoading}
        >
          {subscriptionLoading
            ? "Inscription en cours..."
            : "S'inscrire à la newsletter"}
        </button>
      </div>
      {subscriptionError && (
        <div className="text-center text-red-500 mt-2">
          {subscriptionError}
        </div>
      )}
      {subscriptionSuccess && (
        <div className="text-center text-green-500 mt-2">
          Inscription réussie !
        </div>
      )}
    </div>
  );
};

export default MailchimpSubscription;
