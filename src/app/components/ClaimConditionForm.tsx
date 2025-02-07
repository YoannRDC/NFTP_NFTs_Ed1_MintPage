"use client";

import React, { useState } from "react";
import { setClaimConditions } from "thirdweb/extensions/erc721";
import { sendTransaction } from "thirdweb";
import { getContract, createThirdwebClient, defineChain } from "thirdweb";
import { accountAbstraction, client, nftpNftsEd1Contract } from "../constants"; // 🔗 Adapte à ton projet
import { useActiveAccount } from "thirdweb/react";

const CONTRACT_ADDRESS = "0xYourContractAddress"; // ✅ Remplace par l'adresse de ton contrat
const CHAIN_ID = 137; // Polygon par exemple

export default function ClaimConditionForm() {
  const smartAccount = useActiveAccount();
  const [maxSupply, setMaxSupply] = useState(100);
  const [maxPerWallet, setMaxPerWallet] = useState(1);
  const [currencyAddress, setCurrencyAddress] = useState("0x...");
  const [price, setPrice] = useState(0.1);
  const [overrideAddress, setOverrideAddress] = useState("0x...");
  const [overrideMax, setOverrideMax] = useState("unlimited");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSetClaimConditions = async () => {

    if (!smartAccount || smartAccount.address != "0x7b471306691dee8FC1322775a997E1a6CA29Eee1") {
        alert("Only admin.");
        return;
      }

    try {
      setLoading(true);
      setSuccessMessage("");

      // ✅ Préparation de la transaction
      const transaction = setClaimConditions({
        contract: nftpNftsEd1Contract,
        phases: [
          {
            maxClaimableSupply: BigInt(maxSupply),
            maxClaimablePerWallet: BigInt(maxPerWallet),
            currencyAddress,
            price,
            startTime: new Date(),
            overrideList: [
              { address: overrideAddress, maxClaimable: overrideMax },
            ],
          },
        ],
      });

      // ✅ Envoi de la transaction
      await sendTransaction({ transaction, account: smartAccount });

      setSuccessMessage("Conditions de claim définies avec succès !");
    } catch (error) {
        console.error("Erreur lors de la transaction :", error);

        // ✅ Vérifie si l'erreur est une instance d'Error
        if (error instanceof Error) {
          alert("Erreur lors de la transaction : " + error.message);
        } else {
          // ✅ Gérer les erreurs inconnues
          alert("Une erreur inattendue est survenue.");
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 text-white max-w-md mx-auto mt-6">
      <h2 className="text-xl font-semibold mb-4">Définir les conditions de Claim</h2>

      <label className="block mb-2">
        Max Claimable Supply:
        <input
          type="number"
          value={maxSupply}
          onChange={(e) => setMaxSupply(Number(e.target.value))}
          className="w-full p-2 bg-gray-800 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        Max Claimable Per Wallet:
        <input
          type="number"
          value={maxPerWallet}
          onChange={(e) => setMaxPerWallet(Number(e.target.value))}
          className="w-full p-2 bg-gray-800 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        Currency Address:
        <input
          type="text"
          value={currencyAddress}
          onChange={(e) => setCurrencyAddress(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        Price (in ETH):
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full p-2 bg-gray-800 rounded mt-1"
        />
      </label>

      <h3 className="font-semibold mt-4">Override List</h3>

      <label className="block mb-2">
        Address:
        <input
          type="text"
          value={overrideAddress}
          onChange={(e) => setOverrideAddress(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        Max Claimable:
        <input
          type="text"
          value={overrideMax}
          onChange={(e) => setOverrideMax(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded mt-1"
        />
      </label>

      <button
        onClick={handleSetClaimConditions}
        className={`w-full mt-4 p-2 rounded ${
          loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={loading}
      >
        {loading ? "Transaction en cours..." : "Définir les conditions de Claim"}
      </button>

      {successMessage && (
        <p className="text-green-400 text-center mt-4">{successMessage}</p>
      )}
    </div>
  );
}
