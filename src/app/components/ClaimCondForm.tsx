import React, { useState, useEffect } from "react";
import { getClaimConditions, setClaimConditions } from "thirdweb/extensions/erc721";
import { nftpNftsEd1Contract } from "../constants";

// Token ID concerné
const tokenId = 1n;

const ClaimConditionsTable = () => {
  const [claimConditions, setClaimConditionsState] = useState<
    { currency: string; maxClaimableSupply: bigint; pricePerToken: bigint; quantityLimitPerWallet: bigint; startTimestamp: bigint }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  /** 🚀 1. Récupérer les conditions de claim depuis la blockchain */
  useEffect(() => {
    const fetchConditions = async () => {
      if (!nftpNftsEd1Contract) return;
      try {
        setLoading(true);

        // **********************
        // Claim conditins of the contract

/*         const conditions = await getClaimConditions({ contract: nftpNftsEd1Contract });

        console.log("Claim Conditions récupérées :", conditions);

        if (conditions.length > 0) {
          const formattedConditions = conditions.map((condition) => ({
            currency: condition.currency,
            maxClaimableSupply: BigInt(condition.maxClaimableSupply.toString()),
            pricePerToken: BigInt(condition.pricePerToken.toString()),
            quantityLimitPerWallet: BigInt(condition.quantityLimitPerWallet.toString()),
            startTimestamp: BigInt(Math.floor(Number(condition.startTimestamp) / 1000)), // Converti en bigint UNIX timestamp
          }));
          setClaimConditionsState(formattedConditions);
        } else {
          setClaimConditionsState([]);
          setError("Aucune condition de claim trouvée.");
        } */

        
        // **********************
        // Claim conditins of the TokenID 1

        const tokenId = 1n; // ID du token concerné
        const conditionsToken = await getClaimConditions({ contract: nftpNftsEd1Contract  });

        console.log("Claim Conditions récupérées :", conditionsToken);

      } catch (err) {
        console.error("Erreur lors de la récupération des conditions :", err);
        setError("Impossible de récupérer les conditions.");
      } finally {
        setLoading(false);
      }
    };

    fetchConditions();
  }, [nftpNftsEd1Contract]);

  /** ✅ 2. Mise à jour des valeurs dans le tableau */
  const handleChange = (index: number, field: string, value: string | bigint) => {
    const updatedConditions = [...claimConditions];
    updatedConditions[index] = { ...updatedConditions[index], [field]: value };
    setClaimConditionsState(updatedConditions);
  };

  /** 💾 3. Mettre à jour les conditions sur la blockchain */
  const updateClaimConditions = async () => {
    if (!nftpNftsEd1Contract) return;
    setUpdating(true);

    try {
      const formattedPhases = claimConditions.map((cond) => ({
        currency: cond.currency,
        maxClaimableSupply: cond.maxClaimableSupply,
        pricePerToken: cond.pricePerToken,
        quantityLimitPerWallet: cond.quantityLimitPerWallet,
        startTimestamp: cond.startTimestamp, // Déjà en bigint
      }));

      await setClaimConditions({ contract: nftpNftsEd1Contract, phases: formattedPhases });

      alert("Conditions de claim mises à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert("Erreur lors de la mise à jour des conditions.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Gestion des Conditions de Claim</h2>

      {loading ? (
        <p>Chargement des conditions...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr style={{ background: "#007bff", color: "white" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Currency</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Max Claimable Supply</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Price Per Token</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Max Per Wallet</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Start Time</th>
            </tr>
          </thead>
          <tbody>
            {claimConditions.map((entry, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <input
                    type="text"
                    value={entry.currency}
                    onChange={(e) => handleChange(index, "currency", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <input
                    type="number"
                    value={entry.maxClaimableSupply.toString()}
                    onChange={(e) => handleChange(index, "maxClaimableSupply", BigInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <input
                    type="number"
                    value={entry.pricePerToken.toString()}
                    onChange={(e) => handleChange(index, "pricePerToken", BigInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <input
                    type="number"
                    value={entry.quantityLimitPerWallet.toString()}
                    onChange={(e) => handleChange(index, "quantityLimitPerWallet", BigInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <input
                    type="datetime-local"
                    value={new Date(Number(entry.startTimestamp) * 1000).toISOString().slice(0, 16)}
                    onChange={(e) => handleChange(index, "startTimestamp", BigInt(Math.floor(new Date(e.target.value).getTime() / 1000)))}
                    style={{ width: "100%" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default ClaimConditionsTable;
