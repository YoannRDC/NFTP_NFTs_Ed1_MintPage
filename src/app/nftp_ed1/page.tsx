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
import { claimTo } from "thirdweb/extensions/erc721";
import Link from "next/link";
import Image from "next/image";
import artist_logo from "@public/Logo_20ko.png";

import { getOwnedERC721s } from "../components/getOwnedERC721s";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import MenuItem from "../components/MenuItem";
import { convertPolToEur } from "../utils/conversion";

const NFT_PRICE_POL = 49; // Prix du NFT en POL

const NFTPed1: React.FC = () => {
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [priceInEur, setPriceInEur] = useState<number | null>(null);

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

  const wallets = [
    inAppWallet({
      auth: { options: ["google", "email", "passkey", "phone"] },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
  ];

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-12 mt-20 text-zinc-100">
        NFT Propulsion NFTs Edition 1.
      </h1>
      <br />
            <div className="flex justify-center">
              <ConnectButton client={client} accountAbstraction={accountAbstraction} locale="fr_FR"/>
            </div>
            <br/>
      <MenuItem
        title="NFT Propulsion Edition 1"
        href="/nftp_ed1"
        description="First NFT collection of NFT Propulsion."
        imageSrc="/logo_seul_11.png"
      />
      <br />
      <p>
        NFT Propulsion accompagne les artistes dans la création et la vente d’œuvres d’art sous forme de NFTs, garantissant authenticité, traçabilité et nouvelles opportunités.
      </p>
      <br />
      <Link className="text-sm text-gray-400" target="_blank" href="https://nftpropulsion.fr">
        Visit NFTpropulsion.fr
      </Link>
      <br />
      <br />

      {/* NFT preview */}
      <MediaRenderer
        client={client}
        src="/preview.gif"
        style={{ width: "50%", height: "auto", borderRadius: "10px" }}
      />

      <br />
      <br />

      {/* Mint section */}
      <div className="flex flex-col">
        {smartAccount ? (
          <TransactionButton
            transaction={() =>
              claimTo({
                contract: nftpNftsEd1Contract,
                to: smartAccount.address,
                quantity: 1n,
              })
            }
            onError={(error) => {
              alert(`Erreur: ${error.message}`);
            }}
            onTransactionConfirmed={async () => {
              alert("Achat réussi !");
            }}
          >
            {/* Acheter le NFT: {NFT_PRICE_POL} POL ➝ {priceInEur !== null ? `${priceInEur.toFixed(2)} EUR` : "Chargement..."} */}
            Acheter le NFT: {NFT_PRICE_POL} POL
            <p>(couleur aléatoire)</p>
          </TransactionButton>
        ) : (
          <div>
            <ConnectButton client={client} wallets={wallets} connectModal={{ size: "compact" }} locale="fr_FR" />
            <p style={{ textAlign: "center", width: "100%", marginTop: "10px" }}>
              Connectez-vous pour acheter le NFT.
            </p>
          </div>
        )}
      </div>

      <br />
      <br />
      -- Mes NFTs --

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
                    `https://polygon.nftscan.com/${nftpNftsEd1Contract}/${nft.metadata?.id}`,
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
            <p className="text-center mt-4 text-gray-400">Vous ne possédez pas encore de NFTs.</p>
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
