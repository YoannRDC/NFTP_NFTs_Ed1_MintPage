"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import Link from "next/link";

import { client, getNFTEuroPrice } from "../constants";
import { getOwnedERC721s } from "../components/getOwnedERC721s";
import MenuItem from "../components/MenuItem";
import VideoPresentation from "../components/NFTP_presentation";
import { defineChain, getContract } from "thirdweb";
import ItemERC721transfert from "../components/ItemERC721transfert";
import { getPolEuroRate } from "../utils/conversion";
import { Pagination } from "../components/Pagination";
import MailchimpAccount from "../components/MailchimpAccount";
import InfoBlockchain from "../components/InfoBlockchain";
import { projectMappings } from "../constants";
import { getNFTBalance } from "../utils/FetchBlockchainData";

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
    value: string;
  }[];
  compiler: string;
  editor: string;
}

// Récupération du contrat
const contractAddress = "0xA943ff4f15203efF9af71782c5AA9C2CcC899516";
const contract = getContract({
  client,
  chain: defineChain(137),
  address: contractAddress,
});

// Constantes d'affichage
const videoPresentationLink = "https://youtube.com/embed/tpnHZBySDPw?rel=0&modestbranding=1&autoplay=0";
const videoPresentationTitle = "Présentation Nature & Gîtes";
const collectionName = "Nature & Gîtes - Edition originale";
const collectionPageRef = "/nature_et_gites";
const nftImagesFolder = "/nftImages";
const collectionImageSrc = "/Nature_et_Gites.jpg";
const collectionShortDescription = "Les NFTs de Nature & Gîtes.";
const artistProjectWebsite = "TBD";
const artistProjectWebsitePrettyPrint = "Site en construction";
const contractType = "erc721transfert";
const projectName = "NATETGITES"; // défini dans .env et constants.tsx.
const blockchain = "Polygon";

function NFTPed1Content() {
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

  const stripeMode: "test" | "live" = "live";

  // Charger metadata depuis public/nature_et_gites/metadata.json
  const [metadataData, setMetadataData] = useState<NFTMetadata[]>([]);
  useEffect(() => {
    fetch("/nature_et_gites/metadata.json")
      .then((res) => res.json())
      .then((data: NFTMetadata[]) => setMetadataData(data))
      .catch((err) => console.error("Erreur lors du chargement de metadata", err));
  }, []);

  // Récupération du nombre total de tokens mintés
  const { data: totalMinted, isPending: isMintedLoading } = useReadContract({
    contract,
    method: "function totalMinted() view returns (uint256)",
    params: [],
  });
  const mintedCount = totalMinted ? parseInt(totalMinted.toString()) : 0;
  const totalPages = Math.ceil(mintedCount / itemsPerPage);

  // Page aléatoire au premier chargement
  useEffect(() => {
    if (!hasRandomized && mintedCount > 0 && totalPages > 0) {
      const randomPage = Math.floor(Math.random() * totalPages);
      setCurrentPage(randomPage);
      setHasRandomized(true);
    }
  }, [mintedCount, totalPages, hasRandomized]);

  // Récupérer les NFTs possédés
  useEffect(() => {
    async function fetchNFTs() {
      if (!smartAccount?.address) return;
      setIsLoadingNfts(true);
      try {
        const fetchedNfts = await getOwnedERC721s({
          contract,
          owner: smartAccount.address,
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

  // Calculer les prix en POL
  useEffect(() => {
    async function fetchPrices() {
      if (mintedCount > 0 && polEurRate !== null) {
        const newPrices: { [tokenId: number]: number } = {};
        for (let i = 0; i < mintedCount; i++) {
          const euroPrice = getNFTEuroPrice(projectName, i);
          newPrices[i] = Math.ceil(euroPrice / polEurRate);
        }
        setPricesInPol(newPrices);
      }
    }
    fetchPrices();
  }, [mintedCount, polEurRate]);

  // --- Filtres ---
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTexture, setSelectedTexture] = useState<string>("");
  const [selectedReve, setSelectedReve] = useState<string>("");

  // NFTs dont l'édition est inférieure ou égale à mintedCount
  const mintedMetadata = useMemo(() => {
    return metadataData.filter((item) => item.edition <= mintedCount);
  }, [metadataData, mintedCount]);

  // 1) Catégories (bg_or => "Or", sinon => "Argent")
  const categoryOptions = useMemo((): string[] => {
																				  
    const setOpts = new Set<string>(["Or", "Argent"]);

    mintedMetadata.forEach((item) => {
      const cat = item.attributes.find((a) => a.trait_type === "Or")?.value?.toLowerCase();
      if (cat === "bg_or") {
        setOpts.add("Or");
      } else {
												  
        setOpts.add("Argent");
      }
    });

    return Array.from(setOpts);
  }, [mintedMetadata]);

  // 2) Textures
  const textureOptions = useMemo((): string[] => {
    const rawSet = new Set<string>();
    mintedMetadata.forEach((item) => {
      const val = item.attributes.find((a) => a.trait_type === "Texture")?.value;
      if (val) rawSet.add(val);
    });
    return Array.from(rawSet);
  }, [mintedMetadata]);

  // 3) Reve : transformation de "reve14" en "Reve 14", trié par la partie numérique
																			   
  type ReveOption = { rawValue: string; numericValue: number; displayValue: string };

  const reveOptions = useMemo(() => {
						   
    const rawReveSet = new Set<string>();
    mintedMetadata.forEach((item) => {
      const rawValue = item.attributes.find((a) => a.trait_type === "Reve")?.value || "";
      if (rawValue) rawReveSet.add(rawValue);
    });

							
    const reveArray = Array.from(rawReveSet);

								  
    const reveParsed: ReveOption[] = reveArray.map((raw) => {
      const match = raw.match(/^reve(\d+)$/i);
      const numericValue = match ? parseInt(match[1], 10) : 0;
      const padded = numericValue.toString().padStart(2, "0");
      return {
        rawValue: raw,
        numericValue,
        displayValue: `Reve ${padded}`,
      };
    });

						   
    reveParsed.sort((a, b) => a.numericValue - b.numericValue);

    return reveParsed;
  }, [mintedMetadata]);

  // Filtrage des NFTs
  const filteredNFTs = useMemo(() => {
    return mintedMetadata.filter((item) => {
				   
      const cat = item.attributes.find((a) => a.trait_type === "Or")?.value?.toLowerCase();
      const category = cat === "bg_or" ? "Or" : "Argent";

				
      const texture = item.attributes.find((a) => a.trait_type === "Texture")?.value || "";

							
      const rawReve = item.attributes.find((a) => a.trait_type === "Reve")?.value || "";

							   
      const categoryMatch = selectedCategory === "" || category === selectedCategory;

							
      const textureMatch = selectedTexture === "" || texture === selectedTexture;

						 
      const reveMatch = selectedReve === "" || rawReve === selectedReve;

      return categoryMatch && textureMatch && reveMatch;
    });
  }, [mintedMetadata, selectedCategory, selectedTexture, selectedReve]);

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

  // --- Récupération du solde du wallet NATETGITES ---
  const [nftBalance, setNFTBalance] = useState<number>(0);
  useEffect(() => {
    async function fetchNFTBalance() {
      if (contract) {
        const balance = await getNFTBalance(
          contract,
          projectMappings["NATETGITES"].publicKey
        );
        setNFTBalance(balance ?? 0);
      }
    }
    fetchNFTBalance();
  }, [contract]);

  // Calcul du nombre de NFT vendus : soldCount = mintedCount - nftBalance
  const soldCount = mintedCount - nftBalance;

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
      <div className="decorative-subtitle">Nature & Gîtes</div>

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
          Nature & Gîtes est un projet d’écotourisme innovant, fondé sur la création de lieux de vie autonomes, connectés à la nature et accessibles à tous.
        </div>
        <div className="decorative-description">
          Chaque gîte est pensé comme un espace de ressourcement, intégrant des systèmes d’autonomie énergétique, de gestion responsable de l’eau et de valorisation de l’environnement local.
        </div>
        <div className="decorative-description">
          Cette collection de NFTs symbolise le lancement du projet et sert à financer ses premières étapes concrètes. Elle met à l’honneur Rêve, la mascotte du projet : un chien doux et puissant, compagnon de vie et de voyage, qui incarne le lien entre l’humain, la nature et l’animal.
        </div>
        <div className="decorative-description">
          Chaque NFT représente une œuvre unique basée sur des photographies de Rêve, habillées de textures naturelles et de variations visuelles. En plus de leur valeur artistique, ces NFTs peuvent donner accès à des avantages exclusifs : nuitées offertes, rencontres, goodies, et bien plus encore.
        </div>
        <div className="decorative-description">
          En achetant un NFT de cette collection, vous devenez acteur d’un projet éthique et durable, tout en participant à l’exploration des usages positifs du Web3.
        </div>
        <div className="decorative-description">
          Soutenez un mode de vie alternatif et responsable, en devenant membre de la communauté Nature & Gîtes.
        </div>
      </div>

      <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation src={videoPresentationLink} title={videoPresentationTitle} />
      </div>

{/*       <Link className="text-sm text-gray-400 mb-5" target="_blank" href={artistProjectWebsite}>
        Visit {artistProjectWebsitePrettyPrint}
      </Link> */}																								   
											   
				 

      <div>
        <MailchimpAccount />
      </div>

      <div>
        <InfoBlockchain chainName={blockchain} contractAddress={contractAddress} />
      </div>

      <div className="decorative-title mb-4">-- NFTs à vendre --</div>

      <div className="text-gray-500 mt-2 mb-10 flex justify-center">
        {soldCount} / {mintedCount} NFT vendu
      </div>

      {/* Dropdowns de filtres */}
      <div className="flex flex-wrap gap-4 mb-4 justify-center items-center">
        {/* Catégorie */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border-2 border-blue-500 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Texture */}
        <div className="relative">
          <select
            value={selectedTexture}
            onChange={(e) => setSelectedTexture(e.target.value)}
            className="px-3 py-2 border-2 border-blue-500 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Textures</option>
            {textureOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Reve */}
        <div className="relative">
          <select
            value={selectedReve}
            onChange={(e) => setSelectedReve(e.target.value)}
            className="px-3 py-2 border-2 border-blue-500 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Reve</option>
																			 
            {reveOptions.map(({ rawValue, displayValue }) => (
              <option key={rawValue} value={rawValue}>
                {displayValue}
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
        {isMintedLoading ? (
          <p>Chargement des NFT mintés...</p>
        ) : filteredNFTs.length > 0 ? (
          displayedNFTs.map((item) => {
            const tokenIndex = item.edition - 1;
            return (
              <div key={tokenIndex} className="border p-4 rounded-lg shadow-lg text-center">
                <ItemERC721transfert
                  tokenId={BigInt(tokenIndex)}
                  priceInPol={pricesInPol[tokenIndex] ?? null}
                  priceInEur={getNFTEuroPrice(projectName, tokenIndex)}
                  contract={contract}
                  stripeMode={stripeMode}
                  previewImage={`${collectionPageRef}/${nftImagesFolder}/${tokenIndex
                    .toString()
                    .padStart(4, "0")}.jpg`}
                  redirectPage={collectionPageRef}
                  contractType={contractType}
                  projectName={projectName}
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

export default function NFTPed1() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <NFTPed1Content />
    </Suspense>
  );
}
