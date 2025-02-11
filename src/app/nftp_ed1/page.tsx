"use client"; 
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import {
  accountAbstraction,
  client,
  nftpNftsEd1Contract,
} from "../constants";
import { claimTo } from "thirdweb/extensions/erc721";
import { getOwnedERC721s } from "../components/getOwnedERC721s";
import { convertPolToEur } from "../utils/conversion";
import { readContract } from "thirdweb";
import PurchaseStripe from "../components/PurchaseStripe";

const NFTPed1: React.FC = () => {
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [priceInEur, setPriceInEur] = useState<number | null>(null);
  const [mintedCount, setMintedCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fetchPrice = async () => {
        const eurValue = await convertPolToEur(49);
        setPriceInEur(eurValue);
      };
      fetchPrice();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fetchTotalMinted = async () => {
        try {
          const totalMinted = await readContract({
            contract: nftpNftsEd1Contract,
            method: "function totalMinted() view returns (uint256)",
            params: [],
          });
          setMintedCount(Number(totalMinted));
        } catch (error) {
          console.error("Erreur lors de la récupération du total minted :", error);
        }
      };
      fetchTotalMinted();
    }
  }, []);

  useEffect(() => {
    if (smartAccount?.address && typeof window !== "undefined") {
      const fetchNFTs = async () => {
        setIsLoadingNfts(true);
        try {
          const fetchedNfts = await getOwnedERC721s({
            contract: nftpNftsEd1Contract,
            owner: smartAccount.address,
            requestPerSec: 99,
          });
          setNfts(fetchedNfts || []);
        } catch (error) {
          console.error("Error fetching NFTs:", error);
        } finally {
          setIsLoadingNfts(false);
        }
      };
      fetchNFTs();
    }
  }, [smartAccount?.address]);

  return (
    <div className="flex flex-col items-center">
      <h1>NFT Propulsion Edition 1</h1>
      <ConnectButton client={client} accountAbstraction={accountAbstraction} />
      <MediaRenderer client={client} src="/preview.gif" />
      <p>{mintedCount}/100 NFTs vendus</p>

      {smartAccount && (
        <TransactionButton
          transaction={() =>
            claimTo({
              contract: nftpNftsEd1Contract,
              to: smartAccount.address,
              quantity: 1n,
            })
          }
          onTransactionConfirmed={() => alert("Achat réussi !")}
        >
          Acheter le NFT
        </TransactionButton>
      )}
    </div>
  );
};

export default NFTPed1;
