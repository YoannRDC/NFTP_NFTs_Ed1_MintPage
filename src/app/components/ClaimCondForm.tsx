import React, { useState } from "react";

const ClaimForm = () => {
  const [formData, setFormData] = useState([
    { address: "0xc80f8c3c2cd988b1098809f8728b70b1038ba5b9", maxClaimable: 1, price: 0, currencyAddress: "" },
    { address: "0x7b91F60Faa743275Bd31247aa17B2d67781c3621", maxClaimable: 1, price: 0, currencyAddress: "" },
    { address: "0x545A27b4eB67f8D9901bc121c07DC3424Af81997", maxClaimable: 1, price: 0, currencyAddress: "" },
  ]);

  const handleChange = (index: number, field: string, value: string | number) => {
    const updatedFormData = [...formData];
    updatedFormData[index] = { ...updatedFormData[index], [field]: value };
    setFormData(updatedFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", formData);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Formulaire de Claim</h2>
      <form onSubmit={handleSubmit}>
        {formData.map((entry, index) => (
          <div key={index} style={{ marginBottom: "15px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
            <label>
              Address:
              <input
                type="text"
                value={entry.address}
                onChange={(e) => handleChange(index, "address", e.target.value)}
                style={{ width: "100%", padding: "5px", marginBottom: "5px" }}
              />
            </label>
            <label>
              Max Claimable:
              <input
                type="number"
                value={entry.maxClaimable}
                onChange={(e) => handleChange(index, "maxClaimable", Number(e.target.value))}
                style={{ width: "100%", padding: "5px", marginBottom: "5px" }}
              />
            </label>
            <label>
              Price:
              <input
                type="number"
                value={entry.price}
                onChange={(e) => handleChange(index, "price", Number(e.target.value))}
                style={{ width: "100%", padding: "5px", marginBottom: "5px" }}
              />
            </label>
            <label>
              Currency Address:
              <input
                type="text"
                value={entry.currencyAddress}
                onChange={(e) => handleChange(index, "currencyAddress", e.target.value)}
                style={{ width: "100%", padding: "5px", marginBottom: "5px" }}
              />
            </label>
          </div>
        ))}
        <button type="submit" style={{ padding: "10px 15px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          Soumettre
        </button>
      </form>
    </div>
  );
};

export default ClaimCondForm;
