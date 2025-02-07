"use client";

import React, { useState, useEffect } from "react";
import { setClaimConditions } from "thirdweb/extensions/erc721";
import { sendTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { nftpNftsEd1Contract } from "../constants";

const ADMIN_ADDRESS = "0x7b471306691dee8fc1322775a997e1a6ca29eee1".toLowerCase();

export default function ClaimConditionForm() {
  const smartAccount = useActiveAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [maxSupply, setMaxSupply] = useState(100);
  const [maxPerWallet, setMaxPerWallet] = useState(1);
  const [currencyAddress, setCurrencyAddress] = useState("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
  const [price, setPrice] = useState(0.1);
  const [overrideList, setOverrideList] = useState([{ address: "", maxClaimable: "unlimited", price: "0" }]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Vérifie si l'utilisateur connecté est l'administrateur
  useEffect(() => {
    if (smartAccount?.address?.toLowerCase() === ADMIN_ADDRESS) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [smartAccount]);

  const handleSetClaimConditions = async () => {
    if (!smartAccount || !isAdmin) {
      alert("Only Admin.");
      return;
    }

    try {
      setLoading(true);
      setSuccessMessage("");

      const formattedOverrideList = overrideList.map((entry) => ({
        address: entry.address,
        maxClaimable: entry.maxClaimable === "unlimited" ? "unlimited" : entry.maxClaimable.toString(),
        price: entry.price.toString(), // ✅ Conversion en string
      }));

      const transaction = setClaimConditions({
        contract: nftpNftsEd1Contract,
        phases: [
          {
            maxClaimableSupply: BigInt(maxSupply),
            maxClaimablePerWallet: BigInt(maxPerWallet),
            currencyAddress,
            price,
            startTime: new Date(),
            overrideList: formattedOverrideList, // ✅ Liste des overrides
          },
        ],
      });

      await sendTransaction({ transaction, account: smartAccount });
      setSuccessMessage("Conditions de claim définies avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la transaction :", error);
      alert(`Erreur : ${error?.message || "Une erreur inattendue est survenue."}`);
    } finally {
      setLoading(false);
    }
  };

  const addAddress = () => {
    setOverrideList([...overrideList, { address: "", maxClaimable: "unlimited", price: "0" }]);
  };

  const removeAddress = (index: number) => {
    const updatedList = [...overrideList];
    updatedList.splice(index, 1);
    setOverrideList(updatedList);
  };

  const handleChange = (index: number, field: "address" | "maxClaimable" | "price", value: string) => {
    const updatedList = [...overrideList];
    updatedList[index][field] = value;
    setOverrideList(updatedList);
  };

  // 🚫 Si l'utilisateur n'est pas l'administrateur
  if (!isAdmin) {
    return (
      <div className="p-4 border border-red-500 rounded-lg bg-gray-900 text-white max-w-md mx-auto mt-6 text-center">
        <h2 className="text-xl font-semibold text-red-400">⛔ Accès refusé</h2>
        <p className="text-gray-400 mt-2">Only admin page.</p>
      </div>
    );
  }

  // ✅ Interface pour l'administrateur
  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 text-white max-w-md mx-auto mt-6">
      <h2 className="text-xl font-semibold mb-4">Définir les conditions de Claim</h2>

      <h3 className="font-semibold mb-2">Override List</h3>
      {overrideList.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 mb-4 bg-gray-800 p-3 rounded-lg">
          <input
            type="text"
            placeholder="Adresse"
            value={entry.address}
            onChange={(e) => handleChange(index, "address", e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Max Claimable (ou 'unlimited')"
            value={entry.maxClaimable}
            onChange={(e) => handleChange(index, "maxClaimable", e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Prix (en ETH/MATIC)"
            value={entry.price}
            onChange={(e) => handleChange(index, "price", e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
          <button
            onClick={() => removeAddress(index)}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            ✕ Supprimer
          </button>
        </div>
      ))}

      <button
        onClick={addAddress}
        className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
      >
        ➕ Ajouter une adresse
      </button>

      <button
        onClick={handleSetClaimConditions}
        className={`w-full p-2 rounded ${loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"}`}
        disabled={loading}
      >
        {loading ? "Transaction en cours..." : "Définir les conditions de Claim"}
      </button>

      {successMessage && <p className="text-green-400 text-center mt-4">{successMessage}</p>}
    </div>
  );
}
