"use client";

import React, { useState, useEffect } from "react";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { ContractOptions } from "thirdweb";
import { nftpPubKey } from "../constants";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

interface ClaimConditionFormERC1155Props {
  contract: ContractOptions<[], `0x${string}`>;
  initialOverrides?: { address: string; maxClaimable: string; price: string }[];
  tokenId: bigint;
}

// Fonction pour calculer le Merkle root à partir des entrées du formulaire
function computeMerkleRoot(
  allowList: { address: string; maxClaimable: string; price: string }[]
): `0x${string}` {
  if (allowList.length === 0) {
    return "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
  }
  // Concatène les valeurs de chaque entrée : adaptez la logique de concaténation selon vos besoins précis
  const leaves = allowList.map(item =>
    keccak256(item.address.toLowerCase() + item.maxClaimable + item.price)
  );
  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  return ("0x" + tree.getRoot().toString("hex")) as `0x${string}`;
}

export default function ClaimConditionFormERC1155({
  contract,
  initialOverrides = [],
  tokenId,
}: ClaimConditionFormERC1155Props) {
  const smartAccount = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();

  // États pour la gestion de l'overrideList (pour l'UI uniquement)
  const [overrideList, setOverrideList] = useState<
    { address: string; maxClaimable: string; price: string }[]
  >(initialOverrides);

  // États pour les autres champs du formulaire
  const [maxClaimableSupply, setMaxClaimableSupply] = useState("");
  const [maxClaimablePerWallet, setMaxClaimablePerWallet] = useState("");
  const [currency, setCurrency] = useState("");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [metadata, setMetadata] = useState("");

  // Si initialOverrides change, on met à jour overrideList (pour l'UI)
  useEffect(() => {
    if (initialOverrides?.length > 0) {
      setOverrideList(initialOverrides);
    }
  }, [initialOverrides]);

  // Récupération du conditionId actif pour le token via getActiveClaimConditionId
  const {
    data: activeConditionData,
    isPending: isActivePending,
    error: activeError,
  } = useReadContract({
    contract,
    method: "function getActiveClaimConditionId(uint256 _tokenId) view returns (uint256)",
    params: [tokenId],
  });

  // Utilisation du conditionId récupéré ; s'il n'est pas trouvé, on utilise 0n par défaut
  const conditionId: bigint = activeConditionData
    ? BigInt(activeConditionData.toString())
    : 0n;

  // Lecture des données de la condition via getClaimConditionById (sans overrideList)
  const {
    data: claimData,
    isPending: isClaimPending,
    error: claimError,
  } = useReadContract({
    contract,
    method:
      "function getClaimConditionById(uint256 _tokenId, uint256 _conditionId) view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata) condition)",
    params: [tokenId, conditionId],
  });

  // Préremplissage des champs dès que claimData est disponible (sans overrideList)
  useEffect(() => {
    if (claimData) {
      setMaxClaimableSupply(claimData.maxClaimableSupply.toString());
      setMaxClaimablePerWallet(claimData.quantityLimitPerWallet.toString());
      setCurrency(claimData.currency);
      setPrice(claimData.pricePerToken.toString());
      if (claimData.startTimestamp) {
        const date = new Date(Number(claimData.startTimestamp) * 1000);
        setStartDate(date.toISOString().slice(0, 16));
      }
      setMetadata(claimData.metadata || "");
      // Ne pas mettre overrideList depuis claimData puisque nous voulons utiliser uniquement les entrées saisies via le formulaire.
    }
  }, [claimData]);

  // Fonctions de gestion de l'overrideList (UI)
  const addAddress = () => {
    setOverrideList([
      ...overrideList,
      { address: "", maxClaimable: "1", price: "0" },
    ]);
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

  // Envoi de la transaction pour mettre à jour la condition de claim
  const handleSubmit = async () => {
    if (
      !smartAccount ||
      smartAccount.address.toLowerCase() !== nftpPubKey.toLowerCase()
    ) {
      alert("Seul l'administrateur peut effectuer cette action.");
      return;
    }
    try {
      // Calcul du Merkle root à partir de l'overrideList saisie via le formulaire
      const computedMerkleRoot = computeMerkleRoot(overrideList);

      const condition = {
        startTimestamp: BigInt(Math.floor(new Date(startDate).getTime() / 1000)),
        maxClaimableSupply: BigInt(maxClaimableSupply),
        supplyClaimed: 0n,
        quantityLimitPerWallet: BigInt(maxClaimablePerWallet),
        merkleRoot: computedMerkleRoot,
        pricePerToken: toWei(price),
        currency: currency,
        metadata: metadata,
      };

      const transaction = prepareContractCall({
        contract,
        method:
          "function setClaimConditions(uint256 _tokenId, (uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)",
        params: [tokenId, [condition], false],
      });
      sendTransaction(transaction);
      alert("✅ Conditions mises à jour avec succès !");
    } catch (error: any) {
      console.error(error);
      alert("❌ Erreur lors de la mise à jour des conditions: " + error.message);
    }
  };

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 text-white mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Définir les conditions de Claim (ERC1155)
      </h2>

      {(isActivePending || isClaimPending) && <p>Chargement des conditions...</p>}
      {(activeError || claimError) && (
        <p className="text-red-500">
          Erreur:{" "}
          {(activeError && activeError.message) ||
            (claimError && claimError.message)}
        </p>
      )}

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Max Claimable Supply
        </label>
        <input
          type="text"
          placeholder="Max Claimable Supply"
          value={maxClaimableSupply}
          onChange={(e) => setMaxClaimableSupply(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Max Claimable Per Wallet
        </label>
        <input
          type="text"
          placeholder="Max Claimable Per Wallet"
          value={maxClaimablePerWallet}
          onChange={(e) => setMaxClaimablePerWallet(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Currency Address
        </label>
        <input
          type="text"
          placeholder="Currency Address"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Price (en ETH/MATIC)
        </label>
        <input
          type="text"
          placeholder="Price (en ETH/MATIC)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Start Date
        </label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300">
          Metadata URI
        </label>
        <input
          type="text"
          placeholder="Metadata URI"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded text-white"
        />
      </div>

      {/* Affichage de l'overrideList pour l'UI */}
      {overrideList.map((entry, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 mb-4 bg-gray-800 p-3 rounded-lg"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Adresse
            </label>
            <input
              type="text"
              placeholder="Adresse"
              value={entry.address}
              onChange={(e) =>
                handleChange(index, "address", e.target.value)
              }
              className="p-2 bg-gray-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Max Claimable
            </label>
            <input
              type="text"
              placeholder="Max Claimable"
              value={entry.maxClaimable}
              onChange={(e) =>
                handleChange(index, "maxClaimable", e.target.value)
              }
              className="p-2 bg-gray-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Price (en ETH/MATIC)
            </label>
            <input
              type="text"
              placeholder="Price (en ETH/MATIC)"
              value={entry.price}
              onChange={(e) =>
                handleChange(index, "price", e.target.value)
              }
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
