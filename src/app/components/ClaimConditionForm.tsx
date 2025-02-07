"use client";

import React, { useState, useEffect } from "react";
import { setClaimConditions } from "thirdweb/extensions/erc721";
import { sendTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { nftpNftsEd1Contract } from "../constants";

const ADMIN_ADDRESS = "0x7b471306691dee8fc1322775a997e1a6ca29eee1".toLowerCase();

export default function ClaimConditionForm({ initialOverrides = [] }: { initialOverrides?: any[] }) {
  const smartAccount = useActiveAccount();
  const [overrideList, setOverrideList] = useState(initialOverrides);

  useEffect(() => {
    if (initialOverrides.length > 0) {
      setOverrideList(initialOverrides); // ✅ Pré-remplit avec les données du snapshot
    }
  }, [initialOverrides]);

  const handleChange = (index: number, field: "address" | "maxClaimable" | "price", value: string) => {
    const updatedList = [...overrideList];
    updatedList[index][field] = value;
    setOverrideList(updatedList);
  };

  const handleSubmit = async () => {

    if (!smartAccount) {
        return;
    }
    
    try {
      const transaction = setClaimConditions({
        contract: nftpNftsEd1Contract,
        phases: [
          {
            maxClaimableSupply: BigInt(100),
            maxClaimablePerWallet: BigInt(1),
            currencyAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            price: 0,
            startTime: new Date(),
            overrideList,
          },
        ],
      });

      await sendTransaction({ transaction, account: smartAccount });
      alert("Conditions mises à jour avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour des conditions.");
    }
  };

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 text-white mt-6">
      <h2 className="text-xl font-semibold mb-4">Définir les conditions de Claim</h2>
      {overrideList.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 mb-4 bg-gray-800 p-3 rounded-lg">
          <input
            type="text"
            placeholder="Adresse"
            value={entry.address}
            onChange={(e) => handleChange(index, "address", e.target.value)}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Max Claimable"
            value={entry.maxClaimable}
            onChange={(e) => handleChange(index, "maxClaimable", e.target.value)}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Prix (en ETH/MATIC)"
            value={entry.price}
            onChange={(e) => handleChange(index, "price", e.target.value)}
            className="p-2 bg-gray-700 rounded"
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Enregistrer les conditions
      </button>
    </div>
  );
}
