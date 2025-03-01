"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { client, nftpNftsEd1Contract } from "../constants";
import Link from "next/link";

import { getOwnedERC721s } from "../components/getOwnedERC721s";
import MenuItem from "../components/MenuItem";
// Remplacez convertPolToEur par la fonction inverse qui convertit EUR en POL
import { convertEurToPOL } from "../utils/conversion";
import VideoPresentation from "../components/NFTP_presentation";
import ItemERC721 from "../components/ItemERC721";

//const NFT_DEFAULT_PRICE_POL = 49; // Prix initial (fixe) en POL (au cas où, mais non utilisé pour le calcul)
const NFT_PRICE_EUR = 6; // Prix fixe en Euros
const TOTAL_SUPPLY = 100; // Informatif (affiché x/TOTAL_SUPPLY)
const DEFAULT_NFT_PRICE_POL = 49;

function NFTPed1Content() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("paymentResult");
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [conversionResult, setConversionResult] = useState<{ amount: number; datetime: string } | null>(null);

  // Définir le mode Stripe ici : "test" ou "live"
  const stripeMode: "test" | "live" = "live"; // Changez ici selon votre besoin

  useEffect(() => {
    async function fetchConversion() {
      try {
        const result = await convertEurToPOL(NFT_PRICE_EUR);
        setConversionResult(result);
      } catch (error) {
        console.error("Erreur lors de la conversion EUR vers POL :", error);
      }
    }
    fetchConversion();
    const interval = setInterval(fetchConversion, 60000);
    return () => clearInterval(interval);
  }, []);

  // Récupérer les NFTs de l'utilisateur
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
      {paymentResult === "success" && (
        <div className="my-4 p-4 border-2 border-green-500 text-green-600 rounded">
          Paiement réussi ! Merci pour votre achat.
        </div>
      )}
      {paymentResult === "error" && (
        <div className="my-4 p-4 border-2 border-red-500 text-red-600 rounded">
          Échec du paiement. Veuillez réessayer ou contacter le support.
        </div>
      )}
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
          imageSrc="/logo_seul_11.png"
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
      
      <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation />
      </div>
      
      <Link className="text-sm text-gray-400 mt-5" target="_blank" href="https://nftpropulsion.fr">
        Visit NFTpropulsion.fr
      </Link>
      
      <div className="decorative-title">
        -- NFTs à vendre --
      </div>

      <div className="mb-4">
        {/* Affichage du prix converti en POL et de la datetime */}
        Prix en POL (calculé depuis {NFT_PRICE_EUR} €) :{" "}
        {conversionResult ? Math.ceil(conversionResult.amount) : "Chargement..."}
        <br />
        Dernière mise à jour :{" "}
        {conversionResult ? new Date(conversionResult.datetime).toLocaleString() : "Chargement..."}
      </div>
      
      <div className="flex flex-col items-center w-full md:w-[100%] rounded-[10px]">
        <ItemERC721 
          totalSupply={TOTAL_SUPPLY} 
          priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
          priceInEur={NFT_PRICE_EUR} 
          nftpContract={nftpNftsEd1Contract}
          stripeMode={stripeMode}
        />
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
                    "_blank"
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
              <p className="text-center text-gray-400">
                Vous ne possédez pas de NFTs de cette collection.
              </p>
            </div>
          )}
        </div>
      )}
      
      <Link href={"/"} className="text-sm text-gray-400 mt-8">
        Retour à la page principale.
      </Link>
    </div>
  );
}

// Wrap the content in a Suspense boundary to satisfy Next.js requirements
export default function NFTPed1() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <NFTPed1Content />
    </Suspense>
  );
}
