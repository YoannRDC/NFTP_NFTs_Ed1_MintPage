"use client";
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
import Link from "next/link";

import { getOwnedERC721s } from "../components/getOwnedERC721s";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import MenuItem from "../components/MenuItem";
import { convertPolToEur } from "../utils/conversion";
import VideoPresentation from "../components/NFTP_presentation";
import { readContract } from "thirdweb";
import PurchasePage from "../components/PurchasePage";
import ItemERC721 from "../components/ItemERC721";

const NFT_PRICE_POL = 49; // Prix du NFT en POL
const NFT_PRICE_EUR = 15; // Prix du NFT en POL
const TOTAL_SUPPLY = 100;

const NFTPed1: React.FC = () => {
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [priceInEur, setPriceInEur] = useState<number | null>(null);

  // Récupérer le prix en EUR au chargement et toutes les 60 secondes
  useEffect(() => {
    async function fetchPrice() {
      const eurValue = await convertPolToEur(NFT_PRICE_POL);
      setPriceInEur(eurValue);
    }

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Met à jour toutes les 60s

    return () => clearInterval(interval);
  }, []);

  // Get user NFTs
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!smartAccount?.address) return;

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
  }, [smartAccount?.address]);

  return (
    <div className="flex flex-col items-center">

      <div className="decorative-title">
        -- Présentation de la collection --
      </div>

      <div className="decorative-subtitle">
        NFT Propulsion Edition 1
      </div>

      <div className="mb-10">
        <MenuItem
          title="NFT Propulsion Edition 1"
          href="/nftp_ed1"
          description="First NFT collection of NFT Propulsion."
          imageSrc="/logo_seul_11.png" // ✅ Ajout du `/` pour que Next.js le trouve dans `/public`
        />
      </div>
      
      <div className="mb-10">

        <div className="decorative-description">
          NFT Propulsion accompagne les artistes dans la création et la vente d’œuvres d’art sous forme de NFTs, garantissant authenticité, traçabilité et nouvelles opportunités.
        </div>

        <div className="decorative-description">
          Cette collection exclusive représente la 1ère édition de NFTs créés par NFT Propulsion. <br />
          Limitée à 100 pièces uniques, chaque NFT incarne une vague aux couleurs distinctes, symbolisant la diversité et l’innovation dans l’univers numérique. <br />
          Chaque pièce est numérotée individuellement, offrant à son détenteur un objet rare et authentique, ancré sur la blockchain.
        </div>

        <div className="decorative-description">
          Rejoignez cette aventure et possédez un morceau de l’histoire de NFT Propulsion ! 
        </div>

      </div>

      <div className="flex flex-col items-center mb-10 w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation />
      </div>

      <Link className="text-sm text-gray-400 mt-5" target="_blank" href="https://nftpropulsion.fr">
        Visit NFTpropulsion.fr
      </Link>

      <div className="decorative-title mb-10">
        -- NFTs à vendre --
      </div>

      <div className="flex flex-col items-center mb-10 w-full md:w-[100%] h-[300px] rounded-[10px]">
      <ItemERC721 totalSupply={TOTAL_SUPPLY} priceInPol={NFT_PRICE_POL} priceInEur={NFT_PRICE_EUR} nftpContract={nftpNftsEd1Contract} />
      </div>
      
      <div className="decorative-title">
        -- Mes NFTs --
      </div>

      {isLoadingNfts ? (
        <p>Chargement de vos NFTs...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> 
          {nfts.length > 0 ? (
            nfts.map((nft, index) => (
              <div
                key={index}
                className="border p-4 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() =>
                  window.open(
                    `https://polygon.nftscan.com/${nftpNftsEd1Contract.address}/${nft.metadata?.id || nft.id}`,
                    "_blank" // ✅ Ouvre dans un nouvel onglet
                  )
                }
              >
                <MediaRenderer
                  client={client}
                  src={nft.metadata?.image || "/preview.gif"}
                  style={{ width: "100%", height: "auto", borderRadius: "10px" }}
                />
                <p className="font-semibold mt-2">{nft.metadata?.name || "NFT"}</p>
              </div>
            ))
          ) : (
            <div className="flex justify-center m-10">
              <p className="text-center text-gray-400">Vous ne possédez pas de NFTs de cette collection.</p>
            </div>
          )}
        </div>

      )}

      <Link href={"/"} className="text-sm text-gray-400 mt-8">
        Retour à la page principale.
      </Link>
    </div>
  );
};

export default NFTPed1;

