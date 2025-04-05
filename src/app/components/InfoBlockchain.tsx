import React, { useState } from "react";

interface InfoBolckchainProps {
  chainName: string;
  contractAddress: string;
}

const InfoBlockchain: React.FC<InfoBolckchainProps> = ({
  chainName,
  contractAddress,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <button
        onClick={toggleOpen}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "250px",
          padding: "10px 15px",
          backgroundColor: "transparent",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
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
            marginTop: "5px",
            color: "#fff",
            lineHeight: 1.5,
          }}
        >
          <p style={{ margin: 0 }}>Blockchain: {chainName}</p>
          <p style={{ margin: 0 }}>
            Adresse du contrat:{" "}
            <a
              href={`https://polygonscan.com/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#fff", textDecoration: "underline" }}
            >
              {contractAddress}
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default InfoBlockchain;
