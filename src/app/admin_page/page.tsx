"use client";

import React, { useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import ClaimSnapshot from "../components/ClaimSnapshot";
import ClaimConditionForm from "../components/ClaimConditionForm";
import { client, nftpPubKey } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import Link from "next/link";
import { defineChain, getContract } from "thirdweb";
import { getAll } from "thirdweb/extensions/thirdweb";

// Définition des informations de chaque contrat
const contractsInfo = {
  nftpNftsEd1: {
    address: "0x4d857dD092d3d7b6c0Ad1b5085f5ad3CA8A5C7C9",
    metadataURI:
      "ipfs://QmW82G6PvfRFbb17r1a125MaGMxHnEP3dA83xGs1Mr4Z4f/0",
    chainId: 137,
    contractType: "erc721drop" as const,
  },
  fragChroEd1: {
    address: "0xE5603958Fd35eB9a69aDf8E5b24e9496d6aC038e",
    metadataURI: "", // Ajouter l'URI si nécessaire
    chainId: 80002,
    contractType: "erc1155drop" as const,
  },
};

// Connexion aux contrats
const nftpNftsEd1Contract = getContract({
  client,
  chain: defineChain(contractsInfo.nftpNftsEd1.chainId),
  address: contractsInfo.nftpNftsEd1.address,
});

// Ce contrat est de type ERC1155
const fragChroEd1Contract = getContract({
  client,
  chain: defineChain(contractsInfo.fragChroEd1.chainId),
  address: contractsInfo.fragChroEd1.address,
});

const AdminPage: React.FC = () => {
  const account = useActiveAccount();
  const [snapshotData, setSnapshotData] = useState<any[]>([]);
  const [erc1155Tokens, setErc1155Tokens] = useState<any[]>([]);
  const isAdmin =
    account?.address?.toLowerCase() === nftpPubKey.toLowerCase();

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

  // Fonction pour récupérer les tokens ERC1155 via getAll
  const fetchERC1155Tokens = async () => {
    try {
      const tokens = await getAll({
        contract: fragChroEd1Contract,
        deployer: nftpPubKey, // ou "" si aucune adresse n'est nécessaire
      });
      setErc1155Tokens([...tokens]);
    } catch (error) {
      console.error("Erreur lors du chargement des tokens ERC1155", error);
    }
  };

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
          {/* Section pour le contrat ERC721 (nftpNftsEd1) – comportement inchangé */}
          <ClaimSnapshot
            onSnapshotFetched={setSnapshotData}
            contract={nftpNftsEd1Contract}
          />
          <ClaimConditionForm
            initialOverrides={snapshotData}
            contract={nftpNftsEd1Contract}
            metadata={contractsInfo.nftpNftsEd1.metadataURI}
          />

          {/* Nouvelle section pour le contrat ERC1155 (fragChroEd1) */}
          <div className="erc1155-section mt-10">
            <h2 className="text-xl font-bold">
              Tokens ERC1155 (fragChroEd1)
            </h2>
            <button
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={fetchERC1155Tokens}
            >
              Charger les tokens ERC1155
            </button>
            <div className="mt-4">
              {erc1155Tokens.length > 0 ? (
                erc1155Tokens.map((token: any, index: number) => (
                  <div key={index} className="p-2 border-b">
                    <p>Token ID: {token.id}</p>
                    <p>Nom: {token.name || "N/A"}</p>
                    <p>Quantité: {token.quantity || "N/A"}</p>
                  </div>
                ))
              ) : (
                <p>Aucun token ERC1155 chargé.</p>
              )}
            </div>
          </div>
        </>
      )}

      <Link
        className="px-6 py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105 mt-10"
        target="_blank"
        href="./"
      >
        Back to main page.
      </Link>
    </div>
  );
};

export default AdminPage;
