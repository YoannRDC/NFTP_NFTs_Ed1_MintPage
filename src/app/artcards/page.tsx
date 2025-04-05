"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import { client, getNFTEuroPrice } from "../constants";
import Link from "next/link";

import { getOwnedERC721s } from "../components/getOwnedERC721s";
import MenuItem from "../components/MenuItem";
import VideoPresentation from "../components/NFTP_presentation";
import { defineChain, getContract } from "thirdweb";
import ItemERC721transfert from "../components/ItemERC721transfert";
import { getPolEuroRate } from "../utils/conversion";
import InfoBolckchain from "../components/InfoBolckchain";

const contractAddress = "0x6DF0863afA7b9A81e6ec3AC89f2CD893d2812E47";
const contract = getContract({
  client,
  chain: defineChain(137),
  address: contractAddress,
});

const videoPresentationLink = "https://youtube.com/embed/i3-5yO6GXw0?rel=0&modestbranding=1&autoplay=0";
const videoPresentationTitle = "Présentation Art Cards";
const collectionName = "Art cards";
const collectionPageRef = "/artcards";
const collectionImageSrc = "/ArtCards.gif";
const collectionShortDescription = "Art cards by YoArt.";
const artistProjectWebsite = "https://yoart.art";
const artistProjectWebsitePrettyPrint = "YoArt.art";
const contractType = "erc721transfert";
const projectName = "ARTCARDS" // define in .env and constant.tsx.
const blockchain = "Polygon";

// Composant principal
function NFTPed1Content() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("paymentResult");
  // Récupère un éventuel message d'erreur détaillé dans l'URL
  const errorMessage = searchParams.get("errorMessage");
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  // Stocker les prix en POL pour chaque tokenId (clé : tokenId, valeur : number)
  const [pricesInPol, setPricesInPol] = useState<{ [tokenId: number]: number }>({});
  // Stocker le taux de conversion POL/EUR (récupéré une seule fois)
  const [polEurRate, setPolEurRate] = useState<number | null>(null);

  // Définir le mode Stripe ici : "test" ou "live"
  const stripeMode: "test" | "live" = "live";

  // Récupérer le nombre total de tokens mintés
  const { data: totalMinted, isPending: isMintedLoading } = useReadContract({
    contract: contract,
    method: "function totalMinted() view returns (uint256)",
    params: [],
  });
  const mintedCount = totalMinted ? parseInt(totalMinted.toString()) : 0;

  // Récupérer les NFTs de l'utilisateur
  useEffect(() => {
    async function fetchNFTs() {
      if (!smartAccount?.address) return;
      setIsLoadingNfts(true);
      try {
        const fetchedNfts = await getOwnedERC721s({
          contract: contract,
          owner: smartAccount.address,
          requestPerSec: 99,
        });
        setNfts(fetchedNfts || []);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setIsLoadingNfts(false);
      }
    }
    fetchNFTs();
  }, [smartAccount?.address]);

  // Appeler getPolEurRate() une seule fois pour récupérer le taux de conversion POL/EUR
  useEffect(() => {
    async function fetchConversionRate() {
      try {
        const { rate } = await getPolEuroRate();
        setPolEurRate(rate);
      } catch (error) {
        console.error("Erreur lors de la récupération du taux de conversion POL/EUR:", error);
      }
    }
    fetchConversionRate();
  }, []);

  // Calculer et stocker les prix en POL pour chaque token une fois que mintedCount et le taux de conversion sont disponibles
  useEffect(() => {
    async function fetchPrices() {
      if (mintedCount > 0 && polEurRate !== null) {
        const newPrices: { [tokenId: number]: number } = {};
        for (let i = 0; i < mintedCount; i++) {
          const euroPrice = getNFTEuroPrice(projectName,i);
          // Conversion : si 1 POL vaut "polEurRate" euros, alors:
          // montant en POL = montant en EUR / polEurRate, arrondi au supérieur.
          newPrices[i] = Math.ceil(euroPrice / polEurRate);
        }
        setPricesInPol(newPrices);
      }
    }
    fetchPrices();
  }, [mintedCount, polEurRate]);

  return (
    <div className="flex flex-col items-center">
      {paymentResult === "success" && (
        <div className="my-4 p-4 border-2 border-green-500 text-green-600 rounded">
          Paiement réussi ! Merci pour votre achat.
        </div>
      )}
      {paymentResult === "error" && (
        <div className="my-4 p-4 border-2 border-red-500 text-red-600 rounded">
          Échec du paiement. Veuillez réessayer ou contacter le support.
          {errorMessage && (
            <pre className="whitespace-pre-wrap text-xs mt-2">{errorMessage}</pre>
          )}
        </div>
      )}

      <div className="decorative-title">
        -- Présentation de la collection --
      </div>
      <div className="decorative-subtitle">
        Art cards by YoArt.
      </div>

      <div className="mb-10">
        <MenuItem
          title={collectionName}
          href={collectionPageRef}
          description={collectionShortDescription}
          imageSrc={`${collectionPageRef}${collectionImageSrc}`}
        />
      </div>

      <div className="mb-10">
        <div className="decorative-description">
          Cette collection comprend 52 œuvres d’arts, chacune marquée, en bas à droite de l’image par l’un des 4 symboles parmi trèfle, carreau, pique, ou cœur, et par une valeur, de 2 à 10 plus Valet (Jack), Dame (Queen), Roi (King) ou As (Ace).
        </div>
        <div className="decorative-description">
          Chaque symbole est lié à un sens humain spécifique : le trèfle représente la vue, le carreau le son, le cœur l’odorat, et le pique le goût.
        </div>
        <div className="decorative-description">
          L’objectif central de cette collection est de réinventer et d’embellir ces quatre symboles universels et intemporels du jeu de cartes, qui nous sont familiers dès le plus jeune âge et qui sont reconnus à travers le monde, en leur attribuant une nouvelle dimension artistique à travers le prisme des sens humains.
        </div>
        <div className="decorative-description">
          Les quatre images ont été créées par une intelligence artificielle, à partir de photos reflétant les idées de l’artiste. Les textes sont de l’artiste et l’IA les a intégrés à l’image lors de la génération. Les couples uniques : symbole - valeur, ont été ajoutés manuellement aux œuvres.
        </div>
        <div className="decorative-description">
          Chaque oeuvre est un NFT, garantissant son unicité, son authenticité, son attachement direct à l’artiste, et sa possession exclusive à un seul détenteur. Cette exclusivité vise à créer une communauté de propriétaires partageant un intérêt commun pour cette forme d’art.
        </div>
      </div>

      <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation
          src={videoPresentationLink}
          title={videoPresentationTitle}
        />
      </div>

      <Link className="text-sm text-gray-400 mt-5" target="_blank" href={artistProjectWebsite}>
        Visit {artistProjectWebsitePrettyPrint}
      </Link>

      <div className="decorative-title">
        -- NFTs à vendre --
      </div>

      <div>
        <InfoBolckchain chainName={blockchain} contractAddress={contractAddress} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isMintedLoading ? (
          <p>Chargement des NFT mintés...</p>
        ) : mintedCount > 0 ? (
          Array.from({ length: mintedCount }, (_, index) => (
            <div key={index} className="border p-4 rounded-lg shadow-lg text-center">
              <ItemERC721transfert 
                tokenId={BigInt(index)}
                priceInPol={pricesInPol[index] ?? null}
                priceInEur={getNFTEuroPrice(projectName, index)}
                contract={contract}
                stripeMode={stripeMode}
                previewImage={`${collectionPageRef}/${index.toString().padStart(2, '0')}.jpg`}
                redirectPage={collectionPageRef}
                contractType={contractType}
                projectName={projectName}
              />
            </div>
          ))
        ) : (
          <p>Aucun NFT minté pour le moment.</p>
        )}
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
                    `https://polygon.nftscan.com/${contract.address}/${nft.metadata?.id || nft.id}`,
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

export default function NFTPed1() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <NFTPed1Content />
    </Suspense>
  );
}
