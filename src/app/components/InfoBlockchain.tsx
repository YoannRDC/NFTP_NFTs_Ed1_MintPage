import React, { useState } from "react";

interface InfoBlockchainProps {
  chainName: string;
  contractAddress: string;
}

const InfoBlockchain: React.FC<InfoBlockchainProps> = ({
  chainName,
  contractAddress,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div style={{ margin: "20px 0", maxWidth: "100%", overflowX: "hidden" }}>
      <button
        onClick={toggleOpen}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "250px",
          padding: "10px 15px",
          backgroundColor: "transparent",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          boxSizing: "border-box",
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
            width: "100%",
            maxWidth: "250px",
            boxSizing: "border-box",
          }}
        >
          <p style={{ margin: 0 }}>Blockchain: {chainName}</p>
          <p style={{ margin: 0 }}>
            Adresse du contrat:{" "}
            <a
              href={`https://polygonscan.com/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#fff",
                textDecoration: "underline",
                wordBreak: "break-all",
              }}
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
