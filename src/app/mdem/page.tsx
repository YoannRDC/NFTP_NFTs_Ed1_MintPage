"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import { client, DistributionType, getNFTEuroPrice, projectMappings, StripeMode } from "../constants";
import Link from "next/link";

import { getOwnedERC721 } from "../components/getOwnedERC721";
import MenuItem from "../components/MenuItem";
import VideoPresentation from "../components/NFTP_presentation";
import { defineChain, getContract } from "thirdweb";
import ItemERC721transfert from "../components/ItemERC721transfert";
import { getPolEuroRate } from "../utils/conversion";
import InfoBlockchain from "../components/InfoBlockchain";

const contract = getContract({
  client,
  chain: defineChain(projectMappings["MDEM"].blockchain.id),
  address: projectMappings["MDEM"].contractAddress,
});

const videoPresentationLink = "https://youtube.com/embed/i3-5yO6GXw0?rel=0&modestbranding=1&autoplay=0";
const videoPresentationTitle = "Présentation MdeM";
const collectionName = "MdeM";
const collectionPageRef = "/mdem";
const collectionImageSrc = "/Maya_Profil_square.jpg";
const collectionShortDescription = "NFT collection by MdeM";
const artistProjectWebsite = "https://www.magalidemauroy.com/";
const artistProjectWebsitePrettyPrint = "MagaliDeMauroy.com";
const distributionType = DistributionType.SafeTransferFromERC721;
const requestedQuantity = "1";

// Composant principal
function MDEMContent() {
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
  const stripeMode=StripeMode.Live;

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
        const fetchedNfts = await getOwnedERC721({
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
          const euroPrice = getNFTEuroPrice(projectMappings.MDEM.projectName,i.toString());
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
        NFT collection by MdeM
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
          Magali de Mauroy peint les animaux avec une intensité particulière, comme si leurs yeux fixaient directement le spectateur.
        </div>
        <div className="decorative-description">
          Lors des expositions, les visiteurs sont frappés par la puissance des regards : « On dirait qu’ils nous regardent », « Il est vivant ! », « Quelle intensité ! ». Cette précision n’est pas un hasard : elle cherche à capturer l’authenticité d’un moment, d’un regard, d’un frisson.
        </div>
        <div className="decorative-description">
          Chaque toile témoigne d’une expérience vécue — un chien fidèle, un brocard surpris, une compagnie de sangliers figée, une bécasse qui fuse sous le nez du chien.
        </div>
        <div className="decorative-description">
          Depuis des années, elle partage ces instants avec ses proches, au cœur des chasses familiales dans la Dombes, en Alsace ou dans le Caroux Espinouse.
        </div>
        <div className="decorative-description">
          Aujourd’hui, elle se lance dans les NFT avec une première série qui s’enrichira progressivement, chaque NFT étant calqué sur une œuvre réelle. L’œuvre physique et son double numérique forment un duo unique, offrant une nouvelle manière de collectionner et de partager ces instants d’émotion.
        </div>
      </div>

{/*       <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation
          src={videoPresentationLink}
          title={videoPresentationTitle}
        />
      </div> */}

      <Link className="text-sm text-gray-400 mt-5" target="_blank" href={artistProjectWebsite}>
        Visit {artistProjectWebsitePrettyPrint}
      </Link>

      <div className="decorative-title">
        -- NFTs à vendre --
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
                priceInEur={getNFTEuroPrice(projectMappings.MDEM.projectName, index.toString())}
                contract={contract}
                stripeMode={stripeMode}
                previewImage={`${collectionPageRef}/${index.toString().padStart(2, '0')}.jpg`}
                redirectPage={collectionPageRef}
                distributionType={distributionType}
                buyerWalletAddress={smartAccount?.address || ""}
                recipientWalletAddressOrEmail={smartAccount?.address || ""}
                projectName={projectMappings.MDEM.projectName}
                requestedQuantity={requestedQuantity}
                offererName=""
              />
            </div>
          ))
        ) : (
          <p>Aucun NFT minté pour le moment.</p>
        )}
      </div>

      <div>
        <InfoBlockchain chainName={projectMappings.MDEM.blockchain.name} contractAddress={projectMappings.MDEM.contractAddress} />
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

export default function MDEM() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <MDEMContent />
    </Suspense>
  );
}
