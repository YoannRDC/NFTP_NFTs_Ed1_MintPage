"use client";
import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  TransactionButton,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import {
  client,
  nftpNftsEd1Contract,
} from "../constants";
import { claimTo } from "thirdweb/extensions/erc721";
import Link from "next/link";

import { getOwnedERC721s } from "../components/getOwnedERC721s";
import { createWallet, inAppWallet } from "thirdweb/wallets";

const NFTPed1: React.FC = () => {
  const smartAccount = useActiveAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);

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
      <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-12 text-zinc-100">
      NFT Propulsion NFTs Edition 1.
      </h1>

      <br />
      <br />
      -- My Wallet --
      <ConnectButton client={client} wallets={wallets} connectModal={{ size: "compact" }} locale="fr_FR" />
      First step, connect to the website.
      <br />
      <br />

      {/* NFT preview */}
      <MediaRenderer
        client={client}
        src="/preview.gif"
        style={{ width: "50%", height: "auto", borderRadius: "10px" }}
      />

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
              alert(`Error: ${error.message}`);
            }}
            onTransactionConfirmed={async () => {
              alert("Claim successful!");
            }}
          >
            Acheter un NFT (couleur aléatoire) !
          </TransactionButton>
        ) : (
          <p style={{ textAlign: "center", width: "100%", marginTop: "10px" }}>
            Login to claim or buy an NFT (49 POL)
          </p>
        )}
      </div>

	  <br />
      <br />
      -- Mes NFTs --

      {isLoadingNfts ? (
        <p>My NFTs</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nfts.length > 0 ? (
            nfts.map((nft, index) => (
              <div key={index} className="border p-4 rounded-lg shadow-lg text-center">
                <MediaRenderer
                  client={client}
                  src={nft.metadata?.image || "/preview.gif"}
                  style={{ width: "100%", height: "auto", borderRadius: "10px" }}
                />
                <p className="font-semibold mt-2">{nft.metadata?.name || "NFT"}</p>
              </div>
            ))
          ) : (
            <p className="text-center mt-4 text-gray-400">You don’t own any NFTs.</p>
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
