"use client";

import React, { useState, useEffect } from "react";
import { setClaimConditions as setClaimConditionsERC721 } from "thirdweb/extensions/erc721";
import { ContractOptions, sendTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { nftpPubKey } from "../constants";

interface ClaimConditionFormERC721Props {
  contract: ContractOptions<[], `0x${string}`>;
  initialOverrides?: any[];
  contractType: "erc721drop" | "erc721transfert"; // On limite aux types ERC721
}

export default function ClaimConditionFormERC721({
  contract,
  initialOverrides = [],
  contractType,
}: ClaimConditionFormERC721Props) {
  const smartAccount = useActiveAccount();

  // États pour la gestion des overrides (adresses avec maxClaimable et prix)
  const [overrideList, setOverrideList] = useState<
    { address: string; maxClaimable: string; price: string }[]
  >([]);

  // États pour les champs généraux du formulaire
  const [maxClaimableSupply, setMaxClaimableSupply] = useState("");
  const [maxClaimablePerWallet, setMaxClaimablePerWallet] = useState("");
  const [currencyAddress, setCurrencyAddress] = useState("");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [metadata, setMetadata] = useState("");

  // Mise à jour de l'overrideList si des valeurs initiales sont fournies
  useEffect(() => {
    if (initialOverrides?.length > 0) {
      setOverrideList(initialOverrides);
    }
  }, [initialOverrides]);

  const addAddress = () => {
    setOverrideList([...overrideList, { address: "", maxClaimable: "1", price: "0" }]);
  };

  const removeAddress = (index: number) => {
    const updatedList = [...overrideList];
    updatedList.splice(index, 1);
    setOverrideList(updatedList);
  };

  const handleChange = (
    index: number,
    field: "address" | "maxClaimable" | "price",
    value: string
  ) => {
    const updatedList = [...overrideList];
    updatedList[index][field] = value;
    setOverrideList(updatedList);
  };

  const handleSubmit = async () => {
    if (!smartAccount || smartAccount.address.toLowerCase() !== nftpPubKey.toLowerCase()) {
      alert("Seul l'administrateur peut effectuer cette action.");
      return;
    }

    try {
      const transaction = setClaimConditionsERC721({
        contract,
        phases: [
          {
            maxClaimableSupply: BigInt(maxClaimableSupply),
            maxClaimablePerWallet: BigInt(maxClaimablePerWallet),
            currencyAddress,
            price: parseFloat(price),
            startTime: new Date(startDate),
            overrideList,
            metadata,
          },
        ],
      });
      await sendTransaction({ transaction, account: smartAccount });
      alert("✅ Conditions mises à jour avec succès !");
    } catch (error) {
      console.error(error);
      alert("❌ Erreur lors de la mise à jour des conditions.");
    }
  };

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 text-white mt-6">
      <h2 className="text-xl font-semibold mb-4">Définir les conditions de Claim</h2>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">Max Claimable Supply</label>
        <input
          type="text"
          placeholder="Max Claimable Supply"
          value={maxClaimableSupply}
          onChange={(e) => setMaxClaimableSupply(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">Max Claimable Per Wallet</label>
        <input
          type="text"
          placeholder="Max Claimable Per Wallet"
          value={maxClaimablePerWallet}
          onChange={(e) => setMaxClaimablePerWallet(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">Currency Address</label>
        <input
          type="text"
          placeholder="Currency Address"
          value={currencyAddress}
          onChange={(e) => setCurrencyAddress(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">Price (en ETH/MATIC)</label>
        <input
          type="text"
          placeholder="Price (en ETH/MATIC)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">Start Date</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300">Metadata URI</label>
        <input
          type="text"
          placeholder="Metadata URI"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      {overrideList.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 mb-4 bg-gray-800 p-3 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-300">Adresse</label>
            <input
              type="text"
              placeholder="Adresse"
              value={entry.address}
              onChange={(e) => handleChange(index, "address", e.target.value)}
              className="p-2 bg-gray-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Max Claimable</label>
            <input
              type="text"
              placeholder="Max Claimable"
              value={entry.maxClaimable}
              onChange={(e) => handleChange(index, "maxClaimable", e.target.value)}
              className="p-2 bg-gray-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Prix (en ETH/MATIC)</label>
            <input
              type="text"
              placeholder="Prix (en ETH/MATIC)"
              value={entry.price}
              onChange={(e) => handleChange(index, "price", e.target.value)}
              className="p-2 bg-gray-700 rounded text-white"
            />
          </div>
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
        onClick={handleSubmit}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        💾 Enregistrer les conditions
      </button>
    </div>
  );
}
