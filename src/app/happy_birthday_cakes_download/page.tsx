"use client";
export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { client } from "../constants";

export default function HappyBirthdayCakeDownload() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const account = useActiveAccount();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState(false);
  const [receivedCode, setReceivedCode] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");

  const wallets = [inAppWallet({ auth: { options: ["email"] } })];

  const handleSubmitEmail = async () => {
    if (!email) return;
    // Simule un appel backend pour envoyer le code
    await fetch("/api/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmittedEmail(true);
  };

  const handleValidateCode = () => {
    if (enteredCode === code) {
      setReceivedCode(true);
    } else {
      alert("Code incorrect. Vérifiez votre email.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">🎂 Joyeux anniversaire !</h1>
      <p className="text-center max-w-xl mb-4">
        Merci pour votre achat d’un NFT Happy Birthday Cake !
        <br />
        Pour le récupérer :
      </p>
      <ol className="text-left mb-6 max-w-xl list-decimal list-inside">
        <li>
          Si vous avez un portefeuille crypto, cliquez sur <b>Connect wallet</b> ci-dessous.
        </li>
        <li>
          Sinon, entrez simplement votre adresse email, cliquez sur la petite flèche ➡️ pour recevoir un code par mail.
        </li>
        <li>
          Saisissez ce code ici pour activer le bouton de téléchargement.
        </li>
      </ol>

      <ConnectButton client={client} wallets={wallets} locale="fr_FR" />

      {!account && (
        <div className="mt-8 w-full max-w-md text-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            className="border p-2 w-[80%] rounded-l text-black"
          />
          <button
            onClick={handleSubmitEmail}
            className="bg-blue-600 text-white px-4 py-2 rounded-r"
          >
            ➡️
          </button>
        </div>
      )}

      {submittedEmail && !receivedCode && (
        <div className="mt-4 text-center">
          <input
            type="text"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
            placeholder="Code reçu"
            className="border p-2 rounded text-black"
          />
          <button
            onClick={handleValidateCode}
            className="ml-2 bg-green-600 text-white px-4 py-2 rounded"
          >
            Valider
          </button>
        </div>
      )}

      {(account || receivedCode) && (
        <a
          href="/happy_birthday_cakes/nftImages/0123.jpg" // TODO: dynamiquement selon le NFT attribué
          download
          className="mt-8 bg-purple-700 text-white px-6 py-3 rounded-lg shadow hover:bg-purple-800"
        >
          🎁 Télécharger mon NFT
        </a>
      )}
    </div>
  );
}
