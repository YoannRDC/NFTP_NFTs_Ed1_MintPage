"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { client } from "../constants";
import Link from "next/link";
import MenuItem from "../components/MenuItem";
import { convertEurToPOL } from "../utils/conversion";
import VideoPresentation from "../components/NFTP_presentation";
import { defineChain, getContract } from "thirdweb";
import ItemERC1155 from "../components/ItemERC1155";

//const NFT_DEFAULT_PRICE_POL = 49; // Prix initial (fixe) en POL (au cas où, mais non utilisé pour le calcul)
const NFT_PRICE_EUR = 15; // Prix fixe en Euros
const TOTAL_SUPPLY = 100; // Informatif (affiché x/TOTAL_SUPPLY)
const DEFAULT_NFT_PRICE_POL = 49;

// NFTP contracts
const nicoleMathieuEd1Address = "0xA107eF05dD8eE042348ca5B943d039626aC182C6";

// Connect to your contract
const nicoleMathieuEd1Contract = getContract({
  client,
  chain: defineChain(80002),
  address: nicoleMathieuEd1Address,
});

const videoPresentationLink =
  "https://www.youtube.com/embed/Xu1ybZk8Pqw?rel=0&modestbranding=1&autoplay=0";
const videoPresentationTitle = "Présentation Nicole Mathieu";
const collectionName = "Fragments Chromatiques Edition 1";
const collectionPageRef = "/nicole_mathieu_ed1";
const collectionImageSrc = "/nicole_mathieu_ed1/Nicole_Mathieu.png";
const collectionShortDescription = "First NFT collection of Nicole Mathieu.";
const artistProjectWebsite = "https://www.nmmathieu.com/";
const artistProjectWebsitePrettyPrint = "NMMathieu.com";
const pageAndPublicFolderURI = "nicole_mathieu_ed1";

function NFTPed1Content() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("paymentResult");
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [conversionResult, setConversionResult] = useState<{ amount: number; datetime: string } | null>(
    null
  );

  // Définir le mode Stripe ici : "test" ou "live"
  const stripeMode: "test" | "live" = "test"; // Changez ici selon votre besoin

  useEffect(() => {
    async function fetchConversion() {
      try {
        const result = await convertEurToPOL(NFT_PRICE_EUR);
        setConversionResult(result);
        console.log("Last upadte EUR->POL price:", new Date(result.datetime).toLocaleString());
      } catch (error) {
        console.error("Erreur lors de la conversion EUR vers POL :", error);
      }
    }
    fetchConversion();
    const interval = setInterval(fetchConversion, 60000);
    return () => clearInterval(interval);
  }, []);

  // Récupérer les tokens ERC1155 détenus par l'utilisateur
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!smartAccount?.address) return;
      setIsLoadingNfts(true);
      try {
        // Utilisation de la méthode getOwned pour un contrat ERC1155
        const fetchedTokens = await nicoleMathieuEd1Contract.erc1155.getOwned(smartAccount.address);
        setNfts(fetchedTokens || []);
      } catch (error) {
        console.error("Error fetching ERC1155 tokens:", error);
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
          Paiement réussi ! Merci pour votre achat. Raffraichissez la page pour voir votre NFT !
        </div>
      )}
      {paymentResult === "error" && (
        <div className="my-4 p-4 border-2 border-red-500 text-red-600 rounded">
          Échec du paiement. Veuillez réessayer ou contacter le support.
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
          Au fil des années, ma démarche artistique évolue vers une abstraction où la couleur devient
          centrale, invitant chacun à une exploration personnelle et sensorielle. Loin de la simple
          figuration, mes œuvres cherchent à élargir le champ de l’imaginaire à travers des
          compositions vibrantes et immersives. Cette recherche d’expression m’a naturellement conduit à
          capturer l’essence même de mes créations sous forme de NFT, offrant ainsi une nouvelle
          dimension à mon travail.
        </div>
        <div className="decorative-description">
          Le pastel sec, matériau que j’utilise depuis 1997, a façonné mon approche coloriste. À travers
          différentes séries – des Fonds géométriques structurés aux Fonds noirs inspirés du
          clair-obscur caravagesque, en passant par les Abstractions lyriques aux lignes fluides – j’ai
          exploré la lumière, la matière et le mouvement. Ma rencontre avec le portraitiste anglais Ken
          Paine m’a ensuite ouvert à une gestuelle plus libre, influençant profondément mes œuvres
          ultérieures.
        </div>
        <div className="decorative-description">
          Depuis 2005, la peinture à l’huile s’impose comme un nouveau terrain d’expérimentation, où le
          couteau et le pinceau me permettent de superposer les couleurs et de jouer avec la texture.
          Chaque toile est une construction progressive, où la lumière transparaît à travers les strates
          de matière. Aujourd’hui, cette évolution artistique se prolonge avec mes NFT : des fragments de
          mes œuvres physiques, capturant leur énergie et leur intensité, disponibles en édition
          numérique sur cette page.
        </div>
        <div className="decorative-description">Nicole Mathieu.</div>
      </div>

      <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation src={videoPresentationLink} title={videoPresentationTitle} />
      </div>

      <Link className="text-sm text-gray-400 mt-5" target="_blank" href={artistProjectWebsite}>
        Visit {artistProjectWebsitePrettyPrint}
      </Link>

      <div className="decorative-title">-- NFTs à vendre --</div>

      <div className="flex flex-col items-center w-full md:w-[100%] rounded-[10px]">
        <ItemERC1155
          priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
          priceInEur={NFT_PRICE_EUR}
          contract={nicoleMathieuEd1Contract}
          stripeMode={stripeMode}
          previewImage={`${collectionPageRef}/NMMathieu - Série Vitrail Rythmes 42.JPG`}
          redirectPage={pageAndPublicFolderURI}
        />
      </div>

      <div className="decorative-title">-- Mes NFTs --</div>

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
                    `https://polygon.nftscan.com/${nicoleMathieuEd1Contract.address}/${nft.metadata?.id || nft.id}`,
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
