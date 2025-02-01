"use client";

import React, { useState } from "react";
import { client, nftpNftsEd1Contract } from "../constants";
import { upload } from "thirdweb/storage";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { setClaimConditions } from "thirdweb/extensions/erc721";

/**
 * Ce composant prend en entrée une liste de tuples (adresse, prix, maxClaimable),
 * génère un snapshot sous forme de Merkle Tree et met à jour la condition de claim active.
 */
export default function UpdateClaimCondition() {
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Exemple de liste de tuples : [adresse, prix, maxClaimable]
  const claimTuples = [
    ["0xc80f8c3c2cd988b1098809f8728b70b1038ba5b9", "0", "1"],
    ["0x7b91F60Faa743275Bd31247aa17B2d67781c3621", "0", "1"],
    ["0x545A27b4eB67f8D9901bc121c07DC3424Af81997", "1", "10"],
    ["0x7b471306691dee8FC1322775a997E1a6CA29Eee1", "0", "50"],
  ];

  async function handleUpdateClaimCondition() {
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // 1. Construction de l'objet "claims" et des feuilles du Merkle Tree
      const claims = {};
      const leaves = claimTuples.map(([address, price, maxClaimable]) => {
        // On normalise l'adresse en minuscules
        const normalizedAddress = address.toLowerCase();
        // Stockage des données dans l'objet claims
        claims[normalizedAddress] = {
          price, // (en wei, ou autre unité, selon votre logique)
          maxClaimable,
        };

        // Création de la feuille : on concatène les valeurs et on calcule le hash.
        // Ici, pour simplifier, on concatène en une chaîne, mais dans un cas réel,
        // il faudra reproduire exactement l'encodage utilisé dans le smart contract (ex: abi.encodePacked).
        const leaf = keccak256(
          Buffer.from(normalizedAddress + price + maxClaimable)
        );
        return leaf;
      });

      // 2. Construction du Merkle Tree
      const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const merkleRoot = merkleTree.getHexRoot();
      console.log("Merkle Root généré :", merkleRoot);

      // 3. Création du snapshot au format JSON (structure similaire à celle récupérée)
      const snapshotData = {
        merkleRoot,
        claims: claimTuples.map(([address, price, maxClaimable]) => ({
          address: address.toLowerCase(),
          price,
          maxClaimable,
        })),
      };

      // 4. Upload du snapshot sur Thirdweb Storage
      const snapshotUri = await upload(snapshotData, client);
      console.log("Snapshot uploadé à l'URI :", snapshotUri);

      // 5. Mise à jour (ou création) de la condition de claim active avec le nouveau merkleRoot et le snapshot URI.
      // Notez que la structure de la claim condition dépend de votre contrat.
      // Vous devrez peut-être renseigner d'autres paramètres (startTime, quantityLimit, etc.).
      const newClaimCondition = {
        // Exemple de paramètres : ajustez selon vos besoins et la définition de votre claim condition
        startTime: new Date().toISOString(), // par exemple, démarrage immédiat
        price: "0", // valeur par défaut ; le snapshot contiendra les prix spécifiques par adresse
        maxClaimablePerWallet: "0", // sera contrôlé via le snapshot
        merkleRoot, // on définit le nouveau Merkle Root
        snapshot: snapshotUri, // URI du snapshot uploadé
        // D'autres paramètres (comme le currencyAddress, waitInSecondsBetweenClaims, etc.) peuvent être ajoutés ici
      };

      // 6. Appel à la méthode du SDK pour définir la condition de claim active.
      // La méthode utilisée ici dépend de votre version du SDK Thirdweb.
      // Dans cet exemple, nous appelons une méthode "set" sur le module claimConditions du contrat ERC‑721.
      await setClaimConditions(nftpNftsEd1Contract, newClaimCondition, );

      setUpdateSuccess(true);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la condition de claim :", err);
      setUpdateError("Erreur lors de la mise à jour de la condition de claim.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 text-white">
      <h2 className="text-xl font-semibold">Mise à jour de la condition de claim</h2>
      <button
        onClick={handleUpdateClaimCondition}
        disabled={updating}
        className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
      >
        {updating ? "Mise à jour en cours..." : "Mettre à jour la condition de claim"}
      </button>
      {updateError && <p className="mt-2 text-red-500">{updateError}</p>}
      {updateSuccess && <p className="mt-2 text-green-400">Condition de claim mise à jour avec succès !</p>}
    </div>
  );
}
