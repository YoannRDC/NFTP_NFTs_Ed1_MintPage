"use client";

import React, { useState, useEffect } from "react";
import { setClaimConditions } from "thirdweb/extensions/erc721";
import { sendTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { nftpNftsEd1Contract } from "../constants";

const ADMIN_ADDRESS = "0x7b471306691dee8fc1322775a997e1a6ca29eee1".toLowerCase();

export default function ClaimConditionForm({ initialOverrides = [] }: { initialOverrides?: any[] }) {
  const smartAccount = useActiveAccount();
  const [overrideList, setOverrideList] = useState<{ address: string; maxClaimable: string; price: string }[]>([]);

  // ✅ Champs généraux avec des valeurs par défaut
  const [maxClaimableSupply, setMaxClaimableSupply] = useState("10000");
  const [maxClaimablePerWallet, setMaxClaimablePerWallet] = useState("10");
  const [currencyAddress, setCurrencyAddress] = useState("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
  const [price, setPrice] = useState("49");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [metadata, setMetadata] = useState("ipfs://QmW82G6PvfRFbb17r1a125MaGMxHnEP3dA83xGs1Mr4Z4f/0");

  useEffect(() => {
    if (initialOverrides.length > 0) {
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

  const handleChange = (index: number, field: "address" | "maxClaimable" | "price", value: string) => {
    const updatedList = [...overrideList];
    updatedList[index][field] = value;
    setOverrideList(updatedList);
  };

  const handleSubmit = async () => {
    if (!smartAccount || smartAccount.address.toLowerCase() !== ADMIN_ADDRESS) {
      alert("Seul l'administrateur peut effectuer cette action.");
      return;
    }

    try {
      const transaction = setClaimConditions({
        contract: nftpNftsEd1Contract,
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

      <input
        type="text"
        placeholder="Max Claimable Supply"
        value={maxClaimableSupply}
        onChange={(e) => setMaxClaimableSupply(e.target.value)}
        className="w-full p-2 bg-gray-800 rounded text-white mb-2"
      />

      <input
        type="text"
        placeholder="Max Claimable Per Wallet"
        value={maxClaimablePerWallet}
        onChange={(e) => setMaxClaimablePerWallet(e.target.value)}
        className="w-full p-2 bg-gray-800 rounded text-white mb-2"
      />

      <input
        type="text"
        placeholder="Currency Address"
        value={currencyAddress}
        onChange={(e) => setCurrencyAddress(e.target.value)}
        className="w-full p-2 bg-gray-800 rounded text-white mb-2"
      />

      <input
        type="text"
        placeholder="Price (en ETH/MATIC)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full p-2 bg-gray-800 rounded text-white mb-2"
      />

      <input
        type="datetime-local"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="w-full p-2 bg-gray-800 rounded text-white mb-2"
      />

      <input
        type="text"
        placeholder="Metadata URI"
        value={metadata}
        onChange={(e) => setMetadata(e.target.value)}
        className="w-full p-2 bg-gray-800 rounded text-white mb-4"
      />

      {overrideList.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 mb-4 bg-gray-800 p-3 rounded-lg">
          <input
            type="text"
            placeholder="Adresse"
            value={entry.address}
            onChange={(e) => handleChange(index, "address", e.target.value)}
            className="p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Max Claimable"
            value={entry.maxClaimable}
            onChange={(e) => handleChange(index, "maxClaimable", e.target.value)}
            className="p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Prix (en ETH/MATIC)"
            value={entry.price}
            onChange={(e) => handleChange(index, "price", e.target.value)}
            className="p-2 bg-gray-700 rounded text-white"
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
        onClick={handleSubmit}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        💾 Enregistrer les conditions
      </button>
    </div>
  );
}
