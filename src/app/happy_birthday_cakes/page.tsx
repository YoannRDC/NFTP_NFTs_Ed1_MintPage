"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import Link from "next/link";

import { client, DistributionType, getNFTEuroPrice, StripeMode } from "../constants";
import MenuItem from "../components/MenuItem";
import VideoPresentation from "../components/NFTP_presentation";
import { defineChain, getContract } from "thirdweb";
import ItemERC1155_HBC from "../components/ItemERC1155_HBC";
import { getPolEuroRate } from "../utils/conversion";
import { Pagination } from "../components/Pagination";
import MailchimpAccount from "../components/MailchimpAccount";
import InfoBlockchain from "../components/InfoBlockchain";
import { projectMappings } from "../constants";
import { getNFTBalance } from "../utils/fetchBlockchainData";
import { getOwnedERC1155 } from "../components/getOwnedERC1155";

// Interface pour typer le contenu de metadata.json
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  dna: string;
  edition: number;
  date: number;
  attributes: {
    trait_type: string;
    value: any;
  }[];
  compiler: string;
  editor: string;
}

// Récupération du contrat
const contract = getContract({
  client,
  chain: defineChain(projectMappings.HAPPYBIRTHDAYCAKES.blockchain.id),
  address: projectMappings.HAPPYBIRTHDAYCAKES.contractAddress,
});

// Constantes d'affichage
const videoPresentationLink =
  "https://youtube.com/embed/i3-5yO6GXw0?rel=0&modestbranding=1&autoplay=0";
const videoPresentationTitle = "Happy Birthday Cakes";
const collectionName = "Happy Birthday Cakes";
const collectionPageRef = "/happy_birthday_cakes";
const nftImagesFolder = "/nftImages";
const collectionImageSrc = "/preview.gif";
const collectionShortDescription =
  "Because every birthday deserves a cake, even a digital one !";
const artistProjectWebsite = "https://yoart.art";
const artistProjectWebsitePrettyPrint = "YoART.art";
const distributionType = DistributionType.ClaimToERC1155;

function PageContent() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("paymentResult");
  const errorMessage = searchParams.get("errorMessage");
  const smartAccount = useActiveAccount();

  const [ownedNFTs, setOwnedNFTs] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);

  const [pricesInPol, setPricesInPol] = useState<{ [tokenId: number]: number }>({});
  const [polEurRate, setPolEurRate] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(0);
  const itemsPerPage = 21;
  const [hasRandomized, setHasRandomized] = useState<boolean>(false);

  const stripeMode=StripeMode.Test;

  // Chargement des metadata depuis public/happy_birthday_cakes/metadata.json
  const [metadataData, setMetadataData] = useState<NFTMetadata[]>([]);
  useEffect(() => {
    fetch("/happy_birthday_cakes/metadata.json")
      .then((res) => res.json())
      .then((data: NFTMetadata[]) => setMetadataData(data))
      .catch((err) => console.error("Erreur lors du chargement de metadata", err));
  }, []);

  // Récupération du nombre total de tokens mintés
  const { data: totalNFT, isPending: isTotalNFTLoading } = useReadContract({
    contract,
    method: "function nextTokenIdToMint() view returns (uint256)",
    params: [],
  });
  const totalNFTcount = totalNFT ? parseInt(totalNFT.toString()) : 0;
  const totalPages = Math.ceil(totalNFTcount / itemsPerPage);

  // Sélection d'une page aléatoire au premier chargement
  useEffect(() => {
    if (!hasRandomized && totalNFTcount > 0 && totalPages > 0) {
      const randomPage = Math.floor(Math.random() * totalPages);
      setCurrentPage(randomPage);
      setHasRandomized(true);
    }
  }, [totalNFTcount, totalPages, hasRandomized]);

  // Récupérer les NFTs possédés via l'appel à getOwnedERC1155 en passant "address"
  useEffect(() => {
    async function fetchNFTs() {
      if (!smartAccount?.address) return;
      setIsLoadingNfts(true);
      try {
        const fetchedNfts = await getOwnedERC1155({
          contract,
          address: smartAccount.address,
          requestPerSec: 99,
        });
        setOwnedNFTs(fetchedNfts || []);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setIsLoadingNfts(false);
      }
    }
    fetchNFTs();
  }, [smartAccount?.address]);

  // Taux de conversion POL/EUR
  useEffect(() => {
    async function fetchConversionRate() {
      try {
        const { rate } = await getPolEuroRate();
        setPolEurRate(rate);
      } catch (error) {
        console.error("Erreur lors du chargement du taux de conversion POL/EUR:", error);
      }
    }
    fetchConversionRate();
  }, []);

  // Calculer les prix en POL pour chaque token minté
  useEffect(() => {
    async function fetchPrices() {
      if (totalNFTcount > 0 && polEurRate !== null) {
        const newPrices: { [tokenId: number]: number } = {};
        for (let i = 0; i < totalNFTcount; i++) {
          const euroPrice = getNFTEuroPrice(projectMappings.HAPPYBIRTHDAYCAKES.projectName, i.toString());
          newPrices[i] = Math.ceil(euroPrice / polEurRate);
        }
        setPricesInPol(newPrices);
      }
    }
    fetchPrices();
  }, [totalNFTcount, polEurRate]);

  // --- Filtres basés sur les nouveaux traits : Hundreds, Tens, Units ---
  const [selectedHundreds, setSelectedHundreds] = useState<string>("");
  const [selectedTens, setSelectedTens] = useState<string>("");
  const [selectedUnits, setSelectedUnits] = useState<string>("");

  // NFTs dont l'édition est inférieure ou égale à totalNFTcount
  const mintedMetadata = useMemo(() => {
    return metadataData.filter((item) => item.edition <= totalNFTcount);
  }, [metadataData, totalNFTcount]);

  // Options pour le filtre "Hundreds"
  const hundredsOptions = useMemo((): string[] => {
    const opts = new Set<string>();
    mintedMetadata.forEach((item) => {
      const value = item.attributes.find((a) => a.trait_type === "Hundreds")?.value;
      if (value !== undefined && value !== null) {
        opts.add(value.toString());
      }
    });
    return Array.from(opts);
  }, [mintedMetadata]);

  // Options pour le filtre "Tens"
  const tensOptions = useMemo((): string[] => {
    const opts = new Set<string>();
    mintedMetadata.forEach((item) => {
      const value = item.attributes.find((a) => a.trait_type === "Tens")?.value;
      if (value !== undefined && value !== null) {
        opts.add(value.toString());
      }
    });
    return Array.from(opts);
  }, [mintedMetadata]);

  // Options pour le filtre "Units"
  const unitsOptions = useMemo((): string[] => {
    const opts = new Set<string>();
    mintedMetadata.forEach((item) => {
      const value = item.attributes.find((a) => a.trait_type === "Units")?.value;
      if (value !== undefined && value !== null) {
        opts.add(value.toString());
      }
    });
    return Array.from(opts);
  }, [mintedMetadata]);

  // Filtrage des NFTs en fonction des filtres sélectionnés
  const filteredNFTs = useMemo(() => {
    return mintedMetadata.filter((item) => {
      const hundreds = item.attributes.find((a) => a.trait_type === "Hundreds")?.value?.toString() || "";
      const tens = item.attributes.find((a) => a.trait_type === "Tens")?.value?.toString() || "";
      const units = item.attributes.find((a) => a.trait_type === "Units")?.value?.toString() || "";

      const hundredsMatch = selectedHundreds === "" || hundreds === selectedHundreds;
      const tensMatch = selectedTens === "" || tens === selectedTens;
      const unitsMatch = selectedUnits === "" || units === selectedUnits;
      return hundredsMatch && tensMatch && unitsMatch;
    });
  }, [mintedMetadata, selectedHundreds, selectedTens, selectedUnits]);

  // Pagination sur les NFTs filtrés
  const filteredTotal = filteredNFTs.length;
  const filteredTotalPages = Math.ceil(filteredTotal / itemsPerPage);
  useEffect(() => {
    if (currentPage >= filteredTotalPages) {
      setCurrentPage(0);
    }
  }, [filteredTotalPages, currentPage]);

  const startIndexFiltered = currentPage * itemsPerPage;
  const endIndexFiltered = Math.min(startIndexFiltered + itemsPerPage, filteredTotal);
  const displayedNFTs = filteredNFTs.slice(startIndexFiltered, endIndexFiltered);

  // --- Récupération du solde du wallet ---
  const [nftBalance, setNFTBalance] = useState<number>(0);
  useEffect(() => {
    async function fetchNFTBalance() {
      if (contract) {
        const balance = await getNFTBalance(
          contract,
          projectMappings["HAPPYBIRTHDAYCAKES"].minterPublicKey
        );
        setNFTBalance(balance ?? 0);
      }
    }
    fetchNFTBalance();
  }, [contract]);

  // Calcul du nombre de NFT vendus : soldCount = totalNFTcount - nftBalance
  const soldCount = totalNFTcount - nftBalance;

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

      <div className="decorative-title">-- Présentation de la collection --</div>
      <div className="decorative-subtitle">Happy Birthday Cakes</div>

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
          Welcome to the never-ending virtual bakery where each age is celebrated with a joyful, colorful cake topped with the birthday number.
        </div>
        <div className="decorative-description">
          Whether it’s to celebrate a birth, a milestone, or just another trip around the sun, treat them, or yourself, to a memorable digital slice of happiness.
        </div>
        <div className="decorative-description">
          Send this NFT birthday cake to anyone, using their crypto wallet or simply their email. C’est une manière fun et originale de marquer l’occasion.
        </div>
        <div className="decorative-description">
          This collection is an endless bakery on the blockchain. It goes up to age 122... until someone older comes knocking. 😉
        </div>
      </div>

      <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation src={videoPresentationLink} title={videoPresentationTitle} />
      </div>

      <Link className="text-sm text-gray-400 mb-5" target="_blank" href={artistProjectWebsite}>
        Visit {artistProjectWebsitePrettyPrint}
      </Link>

      <div>
        <MailchimpAccount />
      </div>

      <div className="decorative-title mb-4">-- Cakes à offrir --</div>

      <div className="decorative-description text-gray-500 mt-2 mb-10 flex justify-center">
        {soldCount} / {totalNFTcount} cakes offert
      </div>

      {/* Dropdowns de filtres */}
      <div className="flex flex-wrap gap-4 mb-4 justify-center items-center">
        {/* Filtre Hundreds */}
        <div className="relative">
          <select
            value={selectedHundreds}
            onChange={(e) => setSelectedHundreds(e.target.value)}
            className="px-3 py-2 border-2 border-blue-500 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Hundreds</option>
            {hundredsOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Tens */}
        <div className="relative">
          <select
            value={selectedTens}
            onChange={(e) => setSelectedTens(e.target.value)}
            className="px-3 py-2 border-2 border-blue-500 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Tens</option>
            {tensOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Units */}
        <div className="relative">
          <select
            value={selectedUnits}
            onChange={(e) => setSelectedUnits(e.target.value)}
            className="px-3 py-2 border-2 border-blue-500 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Units</option>
            {unitsOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pagination en haut */}
      {filteredTotalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={filteredTotalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {isTotalNFTLoading ? (
          <p>Chargement des NFT mintés...</p>
        ) : filteredNFTs.length > 0 ? (
          displayedNFTs.map((item) => {
            // On considère que l'édition dans metadata correspond à l'index (édition - 1)
            const tokenIndex = item.edition;
            return (
              <div key={tokenIndex} className="border p-4 rounded-lg shadow-lg text-center">
                <ItemERC1155_HBC
                  tokenId={BigInt(tokenIndex)}
                  priceInPol={pricesInPol[tokenIndex] ?? null}
                  priceInEur={getNFTEuroPrice(projectMappings.HAPPYBIRTHDAYCAKES.projectName, tokenIndex.toString())}
                  contract={contract}
                  blockchainId={contract.chain.id}
                  stripeMode={stripeMode}
                  previewImage={`${collectionPageRef}/${nftImagesFolder}/${tokenIndex
                    .toString()
                    .padStart(4, "0")}.jpg`}
                  redirectPage={collectionPageRef}
                  distributionType={distributionType}
                  projectName={projectMappings.HAPPYBIRTHDAYCAKES.projectName}
                />
              </div>
            );
          })
        ) : (
          <p>Aucun NFT ne correspond aux filtres sélectionnés.</p>
        )}
      </div>

      {/* Pagination en bas */}
      {filteredTotalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={filteredTotalPages}
          onPageChange={setCurrentPage}
        />
      )}
      
      <div>
        <InfoBlockchain chainName={projectMappings.HAPPYBIRTHDAYCAKES.blockchain.name} contractAddress={projectMappings.HAPPYBIRTHDAYCAKES.contractAddress} />
      </div>

      <div className="decorative-title">-- Mes NFTs --</div>

      {isLoadingNfts ? (
        <p>Chargement de vos NFTs...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ownedNFTs.length > 0 ? (
            ownedNFTs.map((nft, index) => (
              <div
                key={index}
                className="border p-4 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() =>
                  window.open(
                    `https://polygon.nftscan.com/${contract.address}/${
                      nft.metadata?.id || nft.id
                    }`,
                    "_blank"
                  )
                }
              >
                <MediaRenderer
                  client={client}
                  src={nft.metadata?.image || "/preview.gif"}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "10px",
                  }}
                />
                <p className="font-semibold mt-2 flex items-center justify-center">
                  {nft.metadata?.name || "NFT"}
                  <span
                    title="Notez que le numéro affiché dans le nom du NFT est son ID plus 1."
                    className="ml-2 cursor-help bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    i
                  </span>
                </p>
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

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <PageContent />
    </Suspense>
  );
}
