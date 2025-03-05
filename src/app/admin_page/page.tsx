"use client";
import React, { useState, useMemo, useEffect } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import ClaimSnapshot from "../components/ClaimSnapshot";
import ClaimConditionForm from "../components/ClaimConditionForm";
import { client, nftpPubKey } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import Link from "next/link";
import { defineChain, getContract } from "thirdweb";

// Informations des contrats NFTP avec chainId
const contractsInfo = {
  nftpNftsEd1: {
    address: "0x4d857dD092d3d7b6c0Ad1b5085f5ad3CA8A5C7C9",
    metadataURI:
      "ipfs://QmW82G6PvfRFbb17r1a125MaGMxHnEP3dA83xGs1Mr4Z4f/0",
    chainId: 137,
  },
  fragChroEd1: {
    address: "0xE5603958Fd35eB9a69aDf8E5b24e9496d6aC038e",
    metadataURI: "", // Ajouter l'URI si nécessaire
    chainId: 80002,
  },
};

// Définir un type pour les clés des contrats
type ContractKey = keyof typeof contractsInfo;

const AdminPage: React.FC = () => {
  const account = useActiveAccount();
  const [snapshotData, setSnapshotData] = useState<any[]>([]);
  const [selectedContractName, setSelectedContractName] =
    useState<ContractKey>("nftpNftsEd1");
  const isAdmin =
    account?.address?.toLowerCase() === nftpPubKey.toLowerCase();

  // Réinitialiser les données quand le contrat change
  useEffect(() => {
    setSnapshotData([]);
  }, [selectedContractName]);

  // Obtenir les informations du contrat sélectionné
  const selectedContractInfo = contractsInfo[selectedContractName];

  // Mémoriser l'instance du contrat pour éviter les re-créations inutiles
  const currentContract = useMemo(() => {
    return getContract({
      client,
      chain: defineChain(selectedContractInfo.chainId),
      address: selectedContractInfo.address,
    });
  }, [selectedContractInfo]);

  const wallets = [
    inAppWallet({
      auth: { options: ["google", "email", "passkey", "phone"] },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="decorative-title">-- Admin Page --</div>

      <div className="m-10">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

      {isAdmin && (
        <>
          {/* Sélecteur de contrat */}
          <div className="mb-6">
            <label htmlFor="contract-select" className="mr-2 font-semibold">
              Sélectionnez le contrat :
            </label>
            <select
              id="contract-select"
              value={selectedContractName}
              onChange={(e) =>
                setSelectedContractName(e.target.value as ContractKey)
              }
              className="p-2 border rounded"
            >
              <option value="nftpNftsEd1">NFTP Nfts Ed1</option>
              <option value="fragChroEd1">Frag Chro Ed1</option>
            </select>
          </div>

          {/* Utiliser une clé basée sur l'adresse permet de forcer le remontage */}
          <ClaimSnapshot
            key={`snapshot-${selectedContractInfo.address}`}
            onSnapshotFetched={setSnapshotData}
            contract={currentContract}
          />
          <ClaimConditionForm
            key={`form-${selectedContractInfo.address}`}
            initialOverrides={snapshotData}
            contract={currentContract}
            metadata={selectedContractInfo.metadataURI}
          />
        </>
      )}

      <Link
        className="px-6 py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
        target="_blank"
        href="./"
      >
        Back to main page.
      </Link>
    </div>
  );
};

export default AdminPage;
