import React, { useState, useEffect } from "react";
import { useContract } from "thirdweb/react";
import { getClaimConditions, setClaimConditions } from "thirdweb/extensions/erc1155";
import { base } from "thirdweb/chains";

// Adresse du contrat ERC-1155 et Token ID concerné
const contractAddress = "VOTRE_CONTRACT_ADDRESS"; // Remplacez par l'adresse de votre contrat
const tokenId = 1n;

const ClaimConditionsForm = () => {
  const { contract } = useContract(contractAddress);
  const [claimConditions, setClaimConditionsState] = useState<
    { address: string; maxClaimable: bigint; price: number; currencyAddress: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  /** 🚀 1. Récupérer les conditions de claim depuis la blockchain */
  useEffect(() => {
    const fetchConditions = async () => {
      if (!contract) return;
      try {
        setLoading(true);
        const conditions = await getClaimConditions({ contract, tokenId });

        if (conditions?.phases.length > 0) {
          const formattedConditions = conditions.phases.map((phase) => ({
            address: phase.merkleRoot || "", // On met l'adresse de la whitelist si applicable
            maxClaimable: phase.maxClaimablePerWallet || 0n,
            price: phase.price || 0,
            currencyAddress: phase.currencyAddress || "",
          }));
          setClaimConditionsState(formattedConditions);
        } else {
          setClaimConditionsState([]);
          setError("Aucune condition de claim trouvée.");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des conditions :", err);
        setError("Impossible de récupérer les conditions.");
      } finally {
        setLoading(false);
      }
    };

    fetchConditions();
  }, [contract]);

  /** ✅ 2. Gérer les mises à jour dans le formulaire */
  const handleChange = (index: number, field: string, value: string | bigint | number) => {
    const updatedConditions = [...claimConditions];
    updatedConditions[index] = { ...updatedConditions[index], [field]: value };
    setClaimConditionsState(updatedConditions);
  };

  /** ➕ Ajouter une nouvelle ligne */
  const addRow = () => {
    setClaimConditionsState([
      ...claimConditions,
      { address: "", maxClaimable: 0n, price: 0, currencyAddress: "" },
    ]);
  };

  /** ❌ Supprimer une ligne */
  const removeRow = (index: number) => {
    const updatedConditions = claimConditions.filter((_, i) => i !== index);
    setClaimConditionsState(updatedConditions);
  };

  /** 💾 3. Mettre à jour les conditions sur la blockchain */
  const updateClaimConditions = async () => {
    if (!contract) return;
    setUpdating(true);

    try {
      const formattedPhases = claimConditions.map((cond) => ({
        merkleRoot: cond.address, // Adresse du bénéficiaire si applicable
        maxClaimablePerWallet: cond.maxClaimable,
        price: cond.price,
        currencyAddress: cond.currencyAddress,
        startTime: new Date(),
      }));

      await setClaimConditions({ contract, tokenId, phases: formattedPhases });

      alert("Conditions de claim mises à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert("Erreur lors de la mise à jour des conditions.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Gestion des Conditions de Claim</h2>

      {loading ? (
        <p>Chargement des conditions...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <form>
          {claimConditions.map((entry, index) => (
            <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="Adresse"
                value={entry.address}
                onChange={(e) => handleChange(index, "address", e.target.value)}
                style={{ flex: "2", padding: "5px" }}
              />
              <input
                type="number"
                placeholder="Max Claimable"
                value={String(entry.maxClaimable)}
                onChange={(e) => handleChange(index, "maxClaimable", BigInt(e.target.value))}
                style={{ flex: "1", padding: "5px" }}
              />
              <input
                type="number"
                placeholder="Prix"
                value={entry.price}
                onChange={(e) => handleChange(index, "price", parseFloat(e.target.value))}
                style={{ flex: "1", padding: "5px" }}
              />
              <input
                type="text"
                placeholder="Currency Address"
                value={entry.currencyAddress}
                onChange={(e) => handleChange(index, "currencyAddress", e.target.value)}
                style={{ flex: "2", padding: "5px" }}
              />
              <button type="button" onClick={() => removeRow(index)} style={{ background: "red", color: "white" }}>
                ❌
              </button>
            </div>
          ))}
          <button type="button" onClick={addRow} style={{ padding: "5px 10px", background: "green", color: "white" }}>
            ➕ Ajouter une ligne
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={updateClaimConditions}
        disabled={updating}
        style={{
          display: "block",
          marginTop: "20px",
          padding: "10px",
          background: updating ? "gray" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {updating ? "Mise à jour en cours..." : "Update Claim Conditions"}
      </button>
    </div>
  );
};

export default ClaimConditionsForm;
