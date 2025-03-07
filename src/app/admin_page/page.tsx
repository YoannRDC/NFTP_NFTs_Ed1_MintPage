"use client";

import React, { useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import ClaimSnapshotERC721 from "../components/ClaimSnapshotERC721";
import ClaimConditionForm from "../components/ClaimConditionForm";
import { client, nftpPubKey } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import Link from "next/link";
import { defineChain, getContract, readContract } from "thirdweb";
import ClaimSnapshotERC1155 from "../components/ClaimSnapshotERC1155";

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

const fragChroEd1Contract = getContract({
  client,
  chain: defineChain(contractsInfo.fragChroEd1.chainId),
  address: contractsInfo.fragChroEd1.address,
});

// Objet pour associer une clé à son contrat
const contractObjects: { [key: string]: any } = {
  nftpNftsEd1: nftpNftsEd1Contract,
  fragChroEd1: fragChroEd1Contract,
};

const AdminPage: React.FC = () => {
  const account = useActiveAccount();
  const [snapshotData, setSnapshotData] = useState<any[]>([]);
  const [erc1155Tokens, setErc1155Tokens] = useState<bigint[]>([]);
  const [selectedContractKey, setSelectedContractKey] = useState<string>("nftpNftsEd1");
  const [selectedERC1155Token, setSelectedERC1155Token] = useState<bigint>(0n);
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

  // Récupérer le contrat sélectionné dans la dropdown
  const selectedContract = contractObjects[selectedContractKey];

  // Fonction pour récupérer le nextTokenIdToMint (de type bigint)
  // et créer la liste des token IDs disponibles (de 0 à nextTokenId - 1)
  const fetchNextTokenId = async () => {
    try {
      const data: bigint = await readContract({
        contract: fragChroEd1Contract,
        method:
          "function nextTokenIdToMint() view returns (uint256)",
        params: [],
      });
      console.log("nextTokenIdToMint: ", data);
      const tokensArray: bigint[] = [];
      for (let i = 0n; i < data; i++) {
        tokensArray.push(i);
      }
      setErc1155Tokens(tokensArray);
      // Définir le token sélectionné par défaut si la liste n'est pas vide
      if (tokensArray.length > 0) {
        setSelectedERC1155Token(tokensArray[0]);
      }
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

      {/* Dropdown pour sélectionner le contrat */}
      {isAdmin && (
        <div className="my-4">
          <label htmlFor="contract-select" className="mr-2 font-bold">
            Choisir le contrat :
          </label>
          <select
            id="contract-select"
            value={selectedContractKey}
            onChange={(e) => setSelectedContractKey(e.target.value)}
            className="border p-2 rounded"
          >
            {Object.keys(contractsInfo).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
      )}

      {isAdmin && selectedContractKey === "nftpNftsEd1" && (
        <>
          {/* Section pour le contrat ERC721 (nftpNftsEd1) */}
          <ClaimSnapshotERC721
            onSnapshotFetched={setSnapshotData}
            contract={selectedContract}
          />
          <ClaimConditionForm
            initialOverrides={snapshotData}
            contract={selectedContract}
          />
        </>
      )}

      {isAdmin && selectedContractKey === "fragChroEd1" && (
        <>
          <div className="erc1155-section mt-10">
            <h2 className="text-xl font-bold">
              Tokens ERC1155 (fragChroEd1)
            </h2>
            <button
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={fetchNextTokenId}
            >
              Charger la liste des tokens ERC1155
            </button>
            {erc1155Tokens.length > 0 && (
              <div className="mt-4">
                <label htmlFor="erc1155-select" className="mr-2 font-bold">
                  Sélectionner le Token ID :
                </label>
                <select
                  id="erc1155-select"
                  value={selectedERC1155Token.toString()}
                  onChange={(e) =>
                    setSelectedERC1155Token(BigInt(e.target.value))
                  }
                  className="border p-2 rounded"
                >
                  {erc1155Tokens.map((token, index) => (
                    <option key={index} value={token.toString()}>
                      Token ID: {token.toString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ClaimSnapshotERC1155
              onSnapshotFetched={setSnapshotData}
              contract={selectedContract}
              tokenId={selectedERC1155Token}
            />
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
