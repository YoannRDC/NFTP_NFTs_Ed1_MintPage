import React, { useState } from "react";

interface InfoBolckchainProps {
  chainName: string;
  contractAddress: string;
}

const InfoBolckchain: React.FC<InfoBolckchainProps> = ({
  chainName,
  contractAddress,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div style={{ width: "300px" }}>
      <button
        onClick={toggleOpen}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "8px",
          cursor: "pointer",
          backgroundColor: "#f5f5f5",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      >
        <span>Informations Blockchain</span>
        <span style={{ marginLeft: "8px" }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#fafafa",
          }}
        >
          <p>Blockchain: {chainName}</p>
          <p>Adresse du contrat: {contractAddress}</p>
        </div>
      )}
    </div>
  );
};

export default InfoBolckchain;
