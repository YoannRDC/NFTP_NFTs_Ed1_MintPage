"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { client, DistributionType, projectMappings, StripeMode } from "../constants";
import Link from "next/link";
import MenuItem from "../components/MenuItem";
import { convertEurToPOL } from "../utils/conversion";
import VideoPresentation from "../components/NFTP_presentation";
import { defineChain, getContract, readContract } from "thirdweb";
import ItemERC1155 from "../components/ItemERC1155";
import { balanceOf } from "thirdweb/extensions/erc1155";

// Constantes de configuration
const NFT_PRICE_EUR = 5; // Prix fixe en Euros
const DISPLAYED_NFT_PRICE_POL = 49; // Only for display, real price in POL in set in the claim conditions.

const theContract = getContract({
  client,
  chain: defineChain(137),
  address: projectMappings.CADENART.contractAddress,
});

// const videoPresentationLink =
//   "https://www.youtube.com/embed/Xu1ybZk8Pqw?rel=0&modestbranding=1&autoplay=0";
const videoPresentationTitle = "Présentation CadenART";
const collectionName = "Photos de CadenART";
const collectionPageRef = "/cadenart";
const collectionImageSrc = "/cadenart/cadenart.jpg";
const collectionShortDescription = "Passionné de nature et de randonnée, je capture des instants simples et authentiques au fil des sentiers.";
const artistProjectWebsite = "TBD";
const artistProjectWebsitePrettyPrint = "TBD";
const distributionType=DistributionType.ClaimToERC1155;
const stripeMode=StripeMode.Live;

// Pour cet exemple, la collection comporte 10 NFTs avec des tokenIds de 0 à 10.
const tokenIds: bigint[] = [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n];

/**
 * Récupère l'URI des métadonnées pour un token donné via le contrat.
 */
async function fetchTokenMetadata(tokenId: bigint): Promise<string | null> {
  try {
    const data = await readContract({
      contract: theContract,
      method: "function uri(uint256 _tokenId) view returns (string)",
      params: [tokenId],
    });
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'URI pour le token", tokenId, error);
    return null;
  }
}

/**
 * Effectue un fetch sur l'URL fournie pour récupérer le JSON des métadonnées du NFT.
 */
async function getNFTmetadata(url: string): Promise<any | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Erreur lors de la récupération des métadonnées : ${response.statusText}`);
      return null;
    }
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error("Erreur lors de la récupération des métadonnées du NFT :", error);
    return null;
  }
}

function PageContent() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("paymentResult");
  const errorMessage = searchParams.get("errorMessage");
  const smartAccount = useActiveAccount();
  const [conversionResult, setConversionResult] = useState<{ amount: number; datetime: string } | null>(null);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  // ownedTokens contiendra pour chaque token possédé : tokenId, balance, metadata et imageUri
  const [ownedTokens, setOwnedTokens] = useState<
    { tokenId: bigint; balance: bigint; metadata?: any; imageUri?: string }[]
  >([]);

  // Actualiser périodiquement la conversion EUR -> POL
  useEffect(() => {
    async function fetchConversion() {
      try {
        const result = await convertEurToPOL(NFT_PRICE_EUR);
        setConversionResult(result);
        console.log(
          "convertEurToPOL :",
          new Date(result.datetime).toLocaleString(),
          ", value (EUR):",
          NFT_PRICE_EUR,
          ", value (POL):",
          result.amount
        );
      } catch (error) {
        console.error("Erreur lors de la conversion EUR vers POL :", error);
      }
    }
    fetchConversion();
    const interval = setInterval(fetchConversion, 60000);
    return () => clearInterval(interval);
  }, []);

  // Récupérer les tokens ERC1155 possédés par l'utilisateur pour chacun des tokenIds
  useEffect(() => {
    async function fetchOwnedTokens() {
      if (!smartAccount?.address) return;
      setIsLoadingNfts(true);
      try {
        const tokens: { tokenId: bigint; balance: bigint; metadata?: any; imageUri?: string }[] = [];
        for (const tokenId of tokenIds) {
          const tokenBalance = await balanceOf({
            contract: theContract,
            owner: smartAccount.address,
            tokenId,
          });
          if (tokenBalance > 0n) {
            const metadataUri = await fetchTokenMetadata(tokenId);
            if (metadataUri) {
              // Conversion de l'URI IPFS en URL HTTP
              const url = metadataUri.replace("ipfs://", "https://ipfs.io/ipfs/");
              const nftMetadata = await getNFTmetadata(url);
              if (nftMetadata) {
                const imageUri = nftMetadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
                tokens.push({ tokenId, balance: tokenBalance, metadata: nftMetadata, imageUri });
              }
            }
          }
        }
        setOwnedTokens(tokens);
      } catch (error) {
        console.error("Erreur lors de la récupération des tokens ERC1155 :", error);
      } finally {
        setIsLoadingNfts(false);
      }
    }
    if (smartAccount?.address) {
      fetchOwnedTokens();
    }
  }, [smartAccount?.address]);

  return (
    <div className="flex flex-col items-center">
      {paymentResult === "success" && (
        <div className="my-4 p-4 border-2 border-green-500 text-green-600 rounded">
          Paiement réussi ! Merci pour votre achat.
        </div>
      )}
      {paymentResult === "error" && (
        <div className="my-4 p-4 border-2 border-red-500 text-red-600 rounded">
          Échec du paiement.
          {errorMessage ? (
            <div className="mt-2">Message d’erreur : {errorMessage}</div>
          ) : (
            <div className="mt-2">Veuillez réessayer ou contacter le support.</div>
          )}
        </div>
      )}
      <div className="decorative-title">-- Présentation de la collection --</div>
      <div className="decorative-subtitle">{collectionName}</div>
      <div className="mb-10">
        <MenuItem
          title={collectionName}
          href={collectionPageRef}
          description={collectionShortDescription}
          imageSrc={collectionImageSrc}
        />
      </div>
      <div className="mb-10">
        <div className="decorative-description">
        Loïc Radenac est un passionné de photographie depuis de très nombreuses années. 
        Amateur de grands espaces et amoureux de la nature, il aime capturer des instants simples mais forts lors de ses randonnées, 
        que ce soit à travers la France ou lors de voyages à l’étranger.
        </div>
        <div className="decorative-description">
        Toujours accompagné de son appareil photo, Loïc prend le temps de s’imprégner des lieux qu’il traverse, 
        à pied ou à bord de son van aménagé. Cette liberté de mouvement lui permet de s’arrêter où bon lui semble, 
        de contempler un paysage au lever du jour ou d’attendre la bonne lumière en fin d’après-midi.
        </div>
        <div className="decorative-description">
        Plus qu’un simple loisir, la photographie est pour lui un moyen de ralentir le rythme, 
        de se connecter à l’essentiel et de garder une trace sensible de ces moments suspendus.
        </div>
        {/* <div className="decorative-description">Loïc Radenac</div> */}
      </div>
      {/* <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation src={videoPresentationLink} title={videoPresentationTitle} />
      </div> */}
{/*       <Link className="text-sm text-gray-400" target="_blank" href={artistProjectWebsite}>
        Visit {artistProjectWebsitePrettyPrint}
      </Link> */}
      <div className="decorative-title mb-5">-- NFTs à vendre --</div>
      <div className="mb-10">
        Retrouvez toutes les œuvres à vendre sur{" "}
        <a
          href="https://opensea.io/fr/collection/photos-de-cadenart"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          Opensea
        </a>.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenIds.slice(0, 20).map((tokenId) => (
          <div key={tokenId.toString()}>
            <ItemERC1155
              tokenId={tokenId}
              priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DISPLAYED_NFT_PRICE_POL}
              priceInEur={NFT_PRICE_EUR}
              contract={theContract}
              stripeMode={stripeMode}
              previewImage={`/cadenart/oeuvres/${tokenId.toString()}.jpg`}
              redirectPage={collectionPageRef}
              distributionType={distributionType}
              projectName={projectMappings.CADENART.projectName}
              showSupply={false}
            />
          </div>
        ))}
      </div>

      <div className="decorative-title">-- Mes NFTs --</div>
      {isLoadingNfts ? (
        <p>Chargement de vos NFTs...</p>
      ) : ownedTokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ownedTokens.map((token, index) => (
            <div
              key={index}
              className="border p-4 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={() =>
                window.open(
                  `https://polygon.nftscan.com/${theContract.address}/${token.tokenId.toString()}`,
                  "_blank"
                )
              }
            >
              <MediaRenderer
                client={client}
                src={token.imageUri || token.metadata?.image}
                style={{ width: "100%", height: "auto", borderRadius: "10px" }}
              />
              <p className="font-semibold mt-2">
                {token.metadata?.name || `Token #${token.tokenId.toString()}`}
              </p>
              <p>Vous en possédez {token.balance.toString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center m-10">
          <p className="text-center text-gray-400">
            Vous ne possédez aucun NFT de cette collection.
          </p>
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
