"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButtonSimple } from "../components/ConnectButtonSimple";
import Image from "next/image";
import { projectMappings } from "../constants";

function HappyBirthdayCakeDownload() {
  const searchParams = useSearchParams();
  const txHash = searchParams.get("txHash");
  const code = searchParams.get("code");
  const offererName = searchParams.get("offererName");
  const tokenId = searchParams.get("tokenId");
  const account = useActiveAccount();

  const [loading, setLoading] = useState(false);
  const [showMetaMaskHelp, setShowMetaMaskHelp] = useState(false);

  const project = projectMappings.HAPPYBIRTHDAYCAKES;

  const previewImage =
    tokenId && `/assets/images/happy-birthday-cakes/${tokenId.toString().padStart(4, "0")}.jpg`;

  const handleDownloadNFT = async () => {
    if (!account?.address || !code || !tokenId || !txHash) {
      alert("Veuillez connecter votre wallet et vérifier les paramètres !");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/happy-birthday-cakes-transfert-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          code,
          giftedWalletAddress: account.address,
          tokenId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("NFT transféré avec succès !");
        setShowMetaMaskHelp(true);
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
    <div className="flex flex-col items-center justify-center p-6 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4">🎂 Joyeux anniversaire !</h1>
      <p className="text-center max-w-xl mb-4">
        {offererName} vous a offert un NFT Happy Birthday Cake !<br />
        Pour le récupérer :
      </p>
      <ol className="text-left mb-6 max-w-xl list-decimal list-inside">
        <li>Cliquez sur <b>Connect wallet</b> ci-dessous.</li>
        <li>Connectez votre portefeuille.</li>
        <li>Cliquez sur <b>Télécharger</b>.</li>
      </ol>

      <ConnectButtonSimple />

      {account && (
        <button
          onClick={handleDownloadNFT}
          disabled={loading}
          className="mt-8 bg-purple-700 text-white px-6 py-3 rounded-lg shadow hover:bg-purple-800 disabled:opacity-50"
        >
          {loading ? "Traitement..." : "🎁 Télécharger mon NFT"}
        </button>
      )}

      {previewImage && (
        <Image
          src={previewImage}
          alt="NFT preview"
          width={400}
          height={400}
          className="rounded-lg mt-10"
          style={{ height: "auto" }}
        />
      )}

      {showMetaMaskHelp && (
        <div className="mt-10 bg-yellow-100 text-yellow-800 p-4 rounded max-w-xl">
          <h2 className="font-semibold mb-2">📱 Voir mon NFT dans MetaMask</h2>
          <p className="text-sm mb-2">
            Pour voir votre NFT dans MetaMask :
          </p>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Ouvrez MetaMask et allez dans l’onglet <b>NFTs</b>.</li>
            <li>Cliquez sur <b>’Importer un NFT’</b>.</li>
            <li>Collez cette adresse de contrat :<br />
              <code className="break-all">{project.contractAddress}</code>
            </li>
            <li>Entrez l’ID du NFT : <b>{tokenId}</b></li>
            <li>Validez, et vous verrez votre NFT 🎉</li>
          </ol>
        </div>
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
