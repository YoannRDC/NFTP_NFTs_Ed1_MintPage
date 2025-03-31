"use client";

import React, { useState, useEffect } from "react";
import {
  ConnectButton,
  useActiveAccount,
  useSendTransaction,
} from "thirdweb/react";
import { claimTo } from "thirdweb/extensions/erc721";
import ClaimSnapshotERC721 from "../components/ClaimSnapshotERC721";
import ClaimConditionForm from "../components/ClaimConditionForm";
import { client, nftpPubKey, getProjectPublicKey } from "../constants";
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
    metadataURI: "",
    chainId: 80002,
    contractType: "erc1155drop" as const,
  },
  artcards: {
    address: "0x6DF0863afA7b9A81e6ec3AC89f2CD893d2812E47",
    metadataURI:
      "ipfs://QmTj3G1KY9fZ91aExuSDGkhYMnBwbd3DWN9D5GVspRasQj/0",
    chainId: 137,
    contractType: "erc721transfert" as const,
  },
};

type ContractKey = keyof typeof contractsInfo;

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
const artcardsContract = getContract({
  client,
  chain: defineChain(contractsInfo.artcards.chainId),
  address: contractsInfo.artcards.address,
});

const contractObjects: { [key in ContractKey]: any } = {
  nftpNftsEd1: nftpNftsEd1Contract,
  fragChroEd1: fragChroEd1Contract,
  artcards: artcardsContract,
};

const AdminPage: React.FC = () => {
  const account = useActiveAccount();
  const [snapshotData, setSnapshotData] = useState<any[]>([]);
  const [erc1155Tokens, setErc1155Tokens] = useState<bigint[]>([]);
  const [selectedContractKey, setSelectedContractKey] =
    useState<ContractKey>("nftpNftsEd1");
  const [selectedERC1155Token, setSelectedERC1155Token] = useState<bigint>(0n);
  const [numberToClaim, setNumberToClaim] = useState("1");

  // États pour Mailchimp
  const [mailchimpData, setMailchimpData] = useState<any>(null);
  const [loadingMailchimp, setLoadingMailchimp] = useState(false);
  const [errorMailchimp, setErrorMailchimp] = useState<string | null>(null);
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<any>(null);

  const isAdmin =
    account?.address?.toLowerCase() === nftpPubKey.toLowerCase();

  // Récupération du contrat sélectionné
  const selectedContract = contractObjects[selectedContractKey];
  const selectedContractType = contractsInfo[selectedContractKey].contractType;

  // Fonction Mailchimp GET
  async function handleMailchimpCall() {
    setLoadingMailchimp(true);
    setErrorMailchimp(null);
    try {
      const res = await fetch(`/api/mailchimp?listId=c642fe82cc`);
      const data = await res.json();
      if (res.ok) {
        setMailchimpData(data);
        console.log("Réponse Mailchimp:", data);
      } else {
        setErrorMailchimp(data.error || "Erreur inconnue");
      }
    } catch (error: any) {
      setErrorMailchimp(error.message);
    }
    setLoadingMailchimp(false);
  }

  // Fonction Mailchimp POST pour inscription
  async function handleSubscribe() {
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    setSubscriptionSuccess(null);
    try {
      const res = await fetch("/api/mailchimp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subscriptionEmail,
          listId: "c642fe82cc",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscriptionSuccess(data);
        console.log("Inscription réussie:", data);
      } else {
        setSubscriptionError(
          data.error || "Erreur inconnue lors de l'inscription"
        );
      }
    } catch (error: any) {
      setSubscriptionError(error.message);
    }
    setSubscriptionLoading(false);
  }

  // Fonctions et effets pour les contrats existants
  const { mutate: sendTransaction, status, error: claimError } =
    useSendTransaction();

  const handleClaim = () => {
    if (!account?.address) {
      console.error("Aucun compte connecté");
      return;
    }
    const claimNumber = BigInt(parseInt(numberToClaim));
    const minterAddress = getProjectPublicKey("ARTCARDS");
    const transaction = claimTo({
      contract: selectedContract,
      to: minterAddress,
      quantity: claimNumber,
    });
    sendTransaction(transaction);
  };

  const fetchNextTokenId = async () => {
    try {
      const data: bigint = await readContract({
        contract: fragChroEd1Contract,
        method: "function nextTokenIdToMint() view returns (uint256)",
        params: [],
      });
      console.log("nextTokenIdToMint: ", data);
      const tokensArray: bigint[] = [];
      for (let i = 0n; i < data; i++) {
        tokensArray.push(i);
      }
      setErc1155Tokens(tokensArray);
      if (tokensArray.length > 0) {
        setSelectedERC1155Token(tokensArray[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des tokens ERC1155", error);
    }
  };

  useEffect(() => {
    if (selectedContractType === "erc1155drop") {
      fetchNextTokenId();
    } else {
      setErc1155Tokens([]);
    }
  }, [selectedContractType]);

  return (
    <div className="flex flex-col items-center">
      <div className="decorative-title">-- Admin Page --</div>

      <div className="m-10">
        <ConnectButton
          client={client}
          wallets={[
            inAppWallet({ auth: { options: ["google", "email", "passkey", "phone"] } }),
            // Autres wallets…
          ]}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

      {isAdmin && (
        // Section Mailchimp
        <div className="flex flex-col items-center mb-10 border p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Mailchimp Management</h2>

          <button
            onClick={handleMailchimpCall}
            className="px-6 py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition mb-4"
            disabled={loadingMailchimp}
          >
            {loadingMailchimp ? "Chargement..." : "Tester Mailchimp API"}
          </button>
          {errorMailchimp && (
            <div className="text-center text-red-500 mb-2">{errorMailchimp}</div>
          )}
          {mailchimpData && (
            <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto max-h-64">
              {JSON.stringify(mailchimpData, null, 2)}
            </pre>
          )}

          <div className="flex flex-col items-center justify-center h-full">
            <input
              type="email"
              placeholder="Votre adresse email"
              value={subscriptionEmail}
              onChange={(e) => setSubscriptionEmail(e.target.value)}
              className="mr-4 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubscribe}
              className="px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
              disabled={subscriptionLoading}
            >
              {subscriptionLoading
                ? "Inscription en cours..."
                : "S'inscrire à la newsletter"}
            </button>
            {subscriptionError && (
              <div className="text-center text-red-500 mt-2">
                {subscriptionError}
              </div>
            )}
            {subscriptionSuccess && (
              <div className="text-center text-green-500 mt-2">
                Inscription réussie !
              </div>
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="my-4">
          <label htmlFor="contract-select" className="mr-2 font-bold">
            Choisir le contrat :
          </label>
          <select
            id="contract-select"
            value={selectedContractKey}
            onChange={(e) =>
              setSelectedContractKey(e.target.value as ContractKey)
            }
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

      {isAdmin &&
        (selectedContractType === "erc721drop" ||
          selectedContractType === "erc721transfert") && (
          <>
            <ClaimSnapshotERC721
              onSnapshotFetched={setSnapshotData}
              contract={selectedContract}
            />
            <ClaimConditionForm
              initialOverrides={snapshotData}
              contract={selectedContract}
              contractType={selectedContractType}
            />
            {selectedContractType === "erc721transfert" && (
              <div className="mt-4">
                <label htmlFor="numberToClaim" className="mr-2 font-bold">
                  Number of claim:
                </label>
                <input
                  id="numberToClaim"
                  type="number"
                  value={numberToClaim}
                  onChange={(e) => setNumberToClaim(e.target.value)}
                  className="border p-2 rounded"
                  min="1"
                />
                <button
                  onClick={handleClaim}
                  disabled={status === "pending"}
                  className="ml-2 px-4 py-2 bg-green-500 rounded"
                >
                  {status === "pending" ? "Claiming..." : "Claim"}
                </button>
                {claimError && (
                  <p className="text-red-500 mt-2">
                    Error: {claimError.message}
                  </p>
                )}
              </div>
            )}
          </>
        )}

      {isAdmin && selectedContractType === "erc1155drop" && (
        <div className="erc1155-section mt-10">
          <h2 className="text-xl font-bold">Tokens ERC1155 (fragChroEd1)</h2>
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
          <ClaimConditionForm
            initialOverrides={snapshotData}
            contract={selectedContract}
            contractType={selectedContractType}
            tokenId={selectedERC1155Token}
          />
        </div>
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
