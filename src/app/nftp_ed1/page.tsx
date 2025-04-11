"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaRenderer, useActiveAccount } from "thirdweb/react";
import { client, DistributionType, StripeMode } from "../constants";
import Link from "next/link";

import { getOwnedERC721 } from "../components/getOwnedERC721";
import MenuItem from "../components/MenuItem";
// Remplacez convertPolToEur par la fonction inverse qui convertit EUR en POL
import VideoPresentation from "../components/NFTP_presentation";
import ItemERC721Claim from "../components/ItemERC721Claim";
import { defineChain, getContract } from "thirdweb";
import MailchimpAccount from "../components/MailchimpAccount";
import InfoBlockchain from "../components/InfoBlockchain";

//const NFT_DEFAULT_PRICE_POL = 49; // Prix initial (fixe) en POL (au cas où, mais non utilisé pour le calcul)
const NFT_PRICE_EUR = 19; // Prix fixe en Euros
const TOTAL_SUPPLY = 100; // Informatif (affiché x/TOTAL_SUPPLY)
const DISPLAYED_NFT_PRICE_POL = 99; // Informative: Price is set via Claim conditions.  

// NFTP contracts
const contractAddress = "0x4d857dD092d3d7b6c0Ad1b5085f5ad3CA8A5C7C9";

// connect to your contract
const nftpNftsEd1Contract = getContract({
  client,
  chain: defineChain(137),
  address: contractAddress,
});

const videoPresentationLink="https://youtube.com/embed/i3-5yO6GXw0?rel=0&modestbranding=1&autoplay=0";
const videoPresentationTitle="Présentation NFT Propulsion";
const collectionName="NFT Propulsion Edition 1";
const collectionPageRef="/nftp_ed1";
const collectionImageSrc="/logo_seul_11.png";
const collectionShortDescription="First NFT collection of NFT Propulsion.";
const artistProjectWebsite="https://nftpropulsion.fr";
const artistProjectWebsitePrettyPrint="NFTpropulsion.fr";
const distributionType=DistributionType.ClaimToERC721;
const projectName="NFTPED1";
const blockchain = "Polygon";

// useless in this context:
const tokenId= 0n;

function NFTPed1Content() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("paymentResult");
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);

  const stripeMode=StripeMode.Live;

  // Récupérer les NFTs de l'utilisateur
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!smartAccount?.address) return;
      setIsLoadingNfts(true);
      try {
        const fetchedNfts = await getOwnedERC721({
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
          title={collectionName}
          href={collectionPageRef}
          description={collectionShortDescription}
          imageSrc={`${collectionPageRef}${collectionImageSrc}`}
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
        <VideoPresentation
          src={videoPresentationLink}
          title={videoPresentationTitle}
        />
      </div>
      
      <Link className="text-sm text-gray-400 mt-5" target="_blank" href={artistProjectWebsite}>
        Visit {artistProjectWebsitePrettyPrint}
      </Link>

      <div>
        <MailchimpAccount />
      </div>
      
      <div className="decorative-title">
        -- NFTs à vendre --
      </div>

      <div>
        <InfoBlockchain chainName={blockchain} contractAddress={contractAddress} />
      </div>
      
      <div className="flex flex-col items-center w-full md:w-[100%] rounded-[10px]">
        <ItemERC721Claim 
          totalSupply={TOTAL_SUPPLY} 
          priceInPol={DISPLAYED_NFT_PRICE_POL}
          priceInEur={NFT_PRICE_EUR} 
          contract={nftpNftsEd1Contract}
          stripeMode={stripeMode}
          previewImage={`${collectionPageRef}/preview.gif`}
          redirectPage={collectionPageRef}
          distributionType={distributionType}
          tokenId={tokenId}
          projectName={projectName}
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
