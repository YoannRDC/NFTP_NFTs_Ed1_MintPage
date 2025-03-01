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
import MenuItem from "../components/MenuItem";
import { convertPolToEur } from "../utils/conversion";
import VideoPresentation from "../components/NFTP_presentation";
import ItemERC721 from "../components/ItemERC721";

const NFT_PRICE_POL = 49; // Prix du NFT en POL
const NFT_PRICE_EUR = 15; // Prix du NFT en POL
const TOTAL_SUPPLY = 100;

const NFTPed1: React.FC = () => {
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [priceInEur, setPriceInEur] = useState<number | null>(null);

    // Définir le mode Stripe ici : "test" ou "live"
    const stripeMode: "test" | "live" = "test"; // Changez ici selon votre besoin
  
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
        Fragments Chromatiques Edition 1
      </div>

      <div className="mb-10">
        <MenuItem
          title="Nicole Mathieu"
          href="/nicole_mathieu_ed1"
          description="First NFT collection of Nicole Mathieu."
          imageSrc="/Nicole_Mathieu.png" // ✅ Ajout du `/` pour que Next.js le trouve dans `/public`
        />
      </div>
      
      <div className="mb-10">

        <div className="decorative-description">
        Au fil des années, ma démarche artistique évolue vers une abstraction où la couleur devient centrale, invitant chacun à une exploration personnelle et sensorielle. 
        Loin de la simple figuration, mes œuvres cherchent à élargir le champ de l’imaginaire à travers des compositions vibrantes et immersives. 
        Cette recherche d’expression m’a naturellement conduit à capturer l’essence même de mes créations sous forme de NFT, offrant ainsi une nouvelle dimension à mon travail.
        </div>

        <div className="decorative-description">
        Le pastel sec, matériau que j’utilise depuis 1997, a façonné mon approche coloriste. 
        À travers différentes séries – des Fonds géométriques structurés aux Fonds noirs inspirés du clair-obscur caravagesque, en passant par les Abstractions lyriques aux lignes fluides – j’ai exploré la lumière, la matière et le mouvement. 
        Ma rencontre avec le portraitiste anglais Ken Paine m’a ensuite ouvert à une gestuelle plus libre, influençant profondément mes œuvres ultérieures.
        </div>

        <div className="decorative-description">
        Depuis 2005, la peinture à l’huile s’impose comme un nouveau terrain d’expérimentation, où le couteau et le pinceau me permettent de superposer les couleurs et de jouer avec la texture. 
        Chaque toile est une construction progressive, où la lumière transparaît à travers les strates de matière. 
        Aujourd’hui, cette évolution artistique se prolonge avec mes NFT : des fragments de mes œuvres physiques, capturant leur énergie et leur intensité, disponibles en édition numérique sur cette page.
        </div>
        
        <div className="decorative-description">
          Nicole Mathieu.
        </div>

      </div>

      <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation />
      </div>

      <Link className="text-sm text-gray-400 mt-5" target="_blank" href="https://nftpropulsion.fr">
        Visit NFTpropulsion.fr
      </Link>

      <div className="decorative-title">
        -- NFTs à vendre --
      </div>

      <div className="flex flex-col items-center w-full md:w-[100%] rounded-[10px]">
        <ItemERC721 
          totalSupply={TOTAL_SUPPLY} 
          priceInPol={NFT_PRICE_POL} 
          priceInEur={NFT_PRICE_EUR} 
          nftpContract={nftpNftsEd1Contract}
          stripeMode={stripeMode}
        />
      </div>

      <div style={{ color: 'red', fontSize: 'xx-large' }}>
      -- Site en développement ! Ne pas interagir SVP --
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

