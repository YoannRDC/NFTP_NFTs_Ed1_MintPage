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
import { client, nftpPubKey, getProjectPublicKey, MAILCHIMP_LIST_ID } from "../constants";
import { inAppWallet } from "thirdweb/wallets";
import Link from "next/link";
import { defineChain, getContract, readContract } from "thirdweb";
import ClaimSnapshotERC1155 from "../components/ClaimSnapshotERC1155";
import MailchimpAccount from "../components/MailchimpAccount";

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
  birthdayCakes: {
    address: "0xc58b841A353ab2b288d8C79AA1F3307F32f77cbf",
    metadataURI:
      "ipfs://QmRVt3U9TqGZVBSJbis48YTVLb1smqXGo7jztAQBGnKmrh",
    chainId: 137,
    contractType: "erc1155drop" as const,
  }
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
const birthdayCakesContract = getContract({
  client,
  chain: defineChain(contractsInfo.birthdayCakes.chainId),
  address: contractsInfo.birthdayCakes.address,
});

const contractObjects: { [key in ContractKey]: any } = {
  nftpNftsEd1: nftpNftsEd1Contract,
  fragChroEd1: fragChroEd1Contract,
  artcards: artcardsContract,
  birthdayCakes: birthdayCakesContract,
};

const AdminPage: React.FC = () => {
  const account = useActiveAccount();
  const [snapshotData, setSnapshotData] = useState<any[]>([]);
  const [erc1155Tokens, setErc1155Tokens] = useState<bigint[]>([]);
  const [selectedContractKey, setSelectedContractKey] =
    useState<ContractKey>("nftpNftsEd1");
  const [selectedERC1155Token, setSelectedERC1155Token] = useState<bigint>(0n);
  const [numberToClaim, setNumberToClaim] = useState("1");

  // État pour stocker les merge fields récupérés depuis Mailchimp
  const [mergeFields, setMergeFields] = useState<any[]>([]);
  // Nouvel état pour stocker les tags disponibles
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  // Nouveaux états pour le bouton d'appel à l'API set-claim-conditions-birthday-cakes
  const [settingConditions, setSettingConditions] = useState(false);
  const [conditionsResult, setConditionsResult] = useState<any>(null);
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  const isAdmin =
    account?.address?.toLowerCase() === nftpPubKey.toLowerCase();

  // Récupération du contrat sélectionné
  const selectedContract = contractObjects[selectedContractKey];
  const selectedContractType = contractsInfo[selectedContractKey].contractType;

  // Récupération des merge fields via l'endpoint dédié
  useEffect(() => {
    const fetchMergeFields = async () => {
      try {
        const res = await fetch(
          `/api/mailchimp/merge-fields?listId=${MAILCHIMP_LIST_ID}`
        );
        const data = await res.json();
        if (data.merge_fields) {
          setMergeFields(data.merge_fields);
        } else {
          setMergeFields([]);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des merge fields:", error);
      }
    };
    fetchMergeFields();
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`/api/mailchimp/tags?listId=${MAILCHIMP_LIST_ID}`);
        const data = await res.json();
        if (data.tags) {
          setAvailableTags(data.tags);
        } else {
          setAvailableTags([]);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des tags disponibles :", error);
      }
    };
    fetchTags();
  }, []);

  // Fonctions et effets pour les contrats existants…
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

  // Fonction d'appel à l'API pour définir les claim conditions des Birthday Cakes
  const handleSetClaimConditions = async () => {
    setSettingConditions(true);
    setConditionsError(null);
    setConditionsResult(null);
    try {
      const res = await fetch("/api/set-claim-conditions-birthday-cakes", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setConditionsError(data.error || "Erreur inconnue");
      } else {
        setConditionsResult(data);
      }
    } catch (err: any) {
      setConditionsError(err.message);
    }
    setSettingConditions(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="decorative-title">-- Admin Page --</div>

      <div className="m-10">
        <ConnectButton
          client={client}
          wallets={[
            inAppWallet({
              auth: { options: ["google", "email", "passkey", "phone"] },
            }),
          ]}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

      {/* Bouton pour définir les claim conditions des Birthday Cakes */}
      {isAdmin && (
        <div className="my-4">
          <p>!! Bouton pour définir les claim conditions des Birthday Cakes !! triggers automatically</p>
          <button
            onClick={handleSetClaimConditions}
            disabled={settingConditions}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-transform transform hover:scale-105"
          >
            {settingConditions ? "Setting Conditions..." : "Set Claim Conditions for Birthday Cakes"}
          </button>
          {conditionsResult && (
            <pre className="mt-2 p-2 bg-gray-100 text-black">
              {JSON.stringify(conditionsResult, null, 2)}
            </pre>
          )}
          {conditionsError && (
            <p className="mt-2 text-red-500">Erreur: {conditionsError}</p>
          )}
        </div>
      )}

      {/* Affichage de la liste des merge fields */}
      {isAdmin && (
        <div className="my-4 p-4 border rounded w-full max-w-md">
          <h2 className="text-xl font-bold mb-2">Liste des merge fields</h2>
          {mergeFields.length > 0 ? (
            <ul>
              {mergeFields.map((field, index) => (
                <li key={field.tag || index}>
                  <span className="font-bold">{field.name}</span> (Tag: {field.tag}) - Type: {field.type}
                </li>
              ))}
            </ul>
          ) : (
            <p>Aucun merge field trouvé.</p>
          )}
        </div>
      )}

      {isAdmin && <MailchimpAccount />}

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
