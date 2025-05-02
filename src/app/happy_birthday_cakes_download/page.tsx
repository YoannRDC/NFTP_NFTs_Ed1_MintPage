"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButtonSimple } from "../components/ConnectButtonSimple";

function HappyBirthdayCakeDownload() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const offererName = searchParams.get("offererName");
  const tokenId = searchParams.get("tokenId");
  const account = useActiveAccount();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDownloadNFT = async () => {
    if (!account?.address || !code) {
      alert("Veuillez connecter votre wallet !");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/happy-birthday-cakes-transfert-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          giftedWalletAddress: account.address,
          tokenId, 
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("NFT téléchargé avec succès, mais aucune image n’a été trouvée.");
      } else {
        alert("Erreur lors du transfert : " + (data.error || "Inconnue"));
      }
    } catch (error) {
      console.error("Erreur appel API:", error);
      alert("Erreur de téléchargement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">🎂 Joyeux anniversaire !</h1>
      <p className="text-center max-w-xl mb-4">
        {offererName} vous a offert un NFT Happy Birthday Cake !<br />
        Pour le récupérer :
      </p>
      <ol className="text-left mb-6 max-w-xl list-decimal list-inside">
        <li>Cliquez sur <b>Connect wallet</b> ci-dessous.</li>
        <li>Connectez votre portefeuille ou entrez votre adresse email.</li>
        <li>Cliquez sur <b>Télécharger</b>.</li>
      </ol>

      <ConnectButtonSimple />

      {account && !imageUrl && (
        <button
          onClick={handleDownloadNFT}
          disabled={loading}
          className="mt-8 bg-purple-700 text-white px-6 py-3 rounded-lg shadow hover:bg-purple-800 disabled:opacity-50"
        >
          {loading ? "Traitement..." : "🎁 Télécharger mon NFT"}
        </button>
      )}

      {imageUrl && (
        <a
          href={imageUrl}
          download
          className="mt-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700"
        >
          📥 Télécharger l’image du NFT
        </a>
      )}
    </div>
  );
}

export default function HBCD() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <HappyBirthdayCakeDownload />
    </Suspense>
  );
}
