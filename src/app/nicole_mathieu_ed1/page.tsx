"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount, useReadContract } from "thirdweb/react";
import { client } from "../constants";
import Link from "next/link";
import MenuItem from "../components/MenuItem";
import { convertEurToPOL } from "../utils/conversion";
import VideoPresentation from "../components/NFTP_presentation";
import { defineChain, getContract } from "thirdweb";
import ItemERC1155 from "../components/ItemERC1155";
import { balanceOf } from "thirdweb/extensions/erc1155";

// Constantes de configuration
const NFT_PRICE_EUR = 15; // Prix fixe en Euros
const DEFAULT_NFT_PRICE_POL = 49;

// Adresse et connexion au contrat NFTP
const nicoleMathieuEd1Address = "0xA107eF05dD8eE042348ca5B943d039626aC182C6";
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
const contractType: "erc721drop" | "erc721collection" | "erc1155drop" | "erc1155edition" = "erc1155edition";
const stripeMode: "test" | "live" = "test";

// Pour cet exemple, on suppose que la collection comporte 10 NFTs avec tokenIds de 1 à 10.
const tokenIds: bigint[] = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n];

async function fetchTokenMetadata(tokenId: bigint, batches: any): Promise<any | null> {
  if (!batches) return null;
  try {
    for (const batch of batches) {
      const start = BigInt(batch.startTokenIdInclusive);
      const end = BigInt(batch.endTokenIdInclusive);
      if (tokenId >= start && tokenId <= end) {
        // Conversion de la baseURI si elle commence par "ipfs://"
        const baseURI = batch.baseURI.startsWith("ipfs://")
          ? batch.baseURI.replace("ipfs://", "https://ipfs.io/ipfs/")
          : batch.baseURI;
        // Ici, on suppose que l'URL des métadonnées est construite en concaténant baseURI et (tokenId - 1).json
        const metadataUrl = `${baseURI}${(tokenId - 1n).toString()}.json`;
        const response = await fetch(metadataUrl);
        if (!response.ok) {
          throw new Error(`Erreur lors du chargement des métadonnées depuis ${metadataUrl}`);
        }
        const metadata = await response.json();
        return metadata;
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des métadonnées pour le token", tokenId, error);
  }
  return null;
}

function NFTPed1Content() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("paymentResult");
  const errorMessage = searchParams.get("errorMessage");
  const smartAccount = useActiveAccount();
  const [conversionResult, setConversionResult] = useState<{ amount: number; datetime: string } | null>(null);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  // ownedTokens contiendra pour chaque token possédé : tokenId, balance, metadata
  const [ownedTokens, setOwnedTokens] = useState<
    { tokenId: bigint; balance: bigint; metadata?: any }[]
  >([]);

  // Récupération des metadata batches via useReadContract (selon la doc)
  const { data: allBatches, isPending: isBatchesLoading } = useReadContract({
    contract: nicoleMathieuEd1Contract,
    method:
      "function getAllMetadataBatches() view returns ((uint256 startTokenIdInclusive, uint256 endTokenIdInclusive, string baseURI)[])",
    params: [],
  });

  // Actualiser périodiquement la conversion EUR -> POL
  useEffect(() => {
    async function fetchConversion() {
      try {
        const result = await convertEurToPOL(NFT_PRICE_EUR);
        setConversionResult(result);
        console.log("Dernière mise à jour EUR -> POL :", new Date(result.datetime).toLocaleString());
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
    const fetchOwnedTokens = async () => {
      if (!smartAccount?.address) return;
      setIsLoadingNfts(true);
      try {
        const tokens: { tokenId: bigint; balance: bigint; metadata?: any }[] = [];
        for (const tokenId of tokenIds) {
          const tokenBalance = await balanceOf({
            contract: nicoleMathieuEd1Contract,
            owner: smartAccount.address,
            tokenId,
          });
          if (tokenBalance > 0n) {
            // Utilisation des metadata batches obtenus via useReadContract pour récupérer les métadonnées
            const metadata = await fetchTokenMetadata(tokenId, allBatches);
            tokens.push({ tokenId, balance: tokenBalance, metadata });
          }
        }
        setOwnedTokens(tokens);
      } catch (error) {
        console.error("Erreur lors de la récupération des tokens ERC1155 :", error);
      } finally {
        setIsLoadingNfts(false);
      }
    };
    // Attendre que le smartAccount soit défini et que les batches soient chargés
    if (smartAccount?.address && allBatches) {
      fetchOwnedTokens();
    }
  }, [smartAccount?.address, allBatches]);

  return (
    <div className="flex flex-col items-center">
      {paymentResult === "success" && (
        <div className="my-4 p-4 border-2 border-green-500 text-green-600 rounded">
          Paiement réussi ! Merci pour votre achat. Raffraichissez la page pour voir votre NFT !
        </div>
      )}
      {paymentResult === "error" && (
        <div className="my-4 p-4 border-2 border-red-500 text-red-600 rounded">
          Échec du paiement.
          {errorMessage ? (
            <div className="mt-2">Message d'erreur : {errorMessage}</div>
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
          de matière. Aujourd’hui, cette évolution artistique se prolonge avec mes NFT : des fragments de
          mes œuvres physiques, capturant leur énergie et leur intensité, disponibles en édition
          numérique sur cette page.
        </div>
        <div className="decorative-description">Nicole Mathieu.</div>
      </div>

      <div className="flex flex-col items-center w-full md:w-[60%] h-[300px] rounded-[10px]">
        <VideoPresentation src={videoPresentationLink} title={videoPresentationTitle} />
      </div>

      <Link className="text-sm text-gray-400" target="_blank" href={artistProjectWebsite}>
        Visit {artistProjectWebsitePrettyPrint}
      </Link>

      <div className="decorative-title mb-5">-- NFTs à vendre --</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <ItemERC1155
            tokenId={1n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_42.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={2n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_49.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={3n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_53.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={4n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_76.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={5n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_79.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={6n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_83.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={7n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_95.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={8n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_96.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={9n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_103.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
        <div>
          <ItemERC1155
            tokenId={10n}
            priceInPol={conversionResult ? Math.ceil(conversionResult.amount) : DEFAULT_NFT_PRICE_POL}
            priceInEur={NFT_PRICE_EUR}
            contract={nicoleMathieuEd1Contract}
            stripeMode={stripeMode}
            previewImage={`${collectionPageRef}/Vitrail_Rythmes_104.jpg`}
            redirectPage={collectionPageRef}
            contractType={contractType}
          />
        </div>
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
                  `https://polygon.nftscan.com/${nicoleMathieuEd1Contract.address}/${token.tokenId.toString()}`,
                  "_blank"
                )
              }
            >
              <MediaRenderer
                client={client}
                src={token.metadata?.image}
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

// Wrap the content in a Suspense boundary to satisfy Next.js requirements
export default function NFTPed1() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <NFTPed1Content />
    </Suspense>
  );
}
