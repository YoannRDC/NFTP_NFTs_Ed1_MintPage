"use client";

import React, { useEffect, useState } from "react";
import {
    ConnectButton,
    MediaRenderer,
    TransactionButton,
    useActiveAccount,
  } from "thirdweb/react";
  import PurchasePage from "./PurchasePage";
import { client, nftpNftsEd1Contract } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { readContract } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc721";

// Vous pouvez définir une interface pour les props si nécessaire
interface ItemERC721Props {
  totalSupply: number;
  priceInPol: number | string| null;
  priceInEur: number | string | null;
  nftpContract: any;
}

export default function ItemERC721({
  totalSupply,
  priceInPol,
  priceInEur,
  nftpContract,
}: ItemERC721Props) {

  const smartAccount = useActiveAccount();
  const [mintedCount, setMintedCount] = useState<number>(0);

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

    // Get number of minted NFTs
    useEffect(() => {
    const fetchTotalMinted = async () => {
        try {
        const totalMinted = await readContract({
            contract: nftpNftsEd1Contract,
            method: "function totalMinted() view returns (uint256)",
            params: [],
        });
        setMintedCount(Number(totalMinted)); // ✅ Stocker le résultat dans l'état
        } catch (error) {
            console.error("Erreur lors de la récupération du total minted :", error);
        }
    };

    fetchTotalMinted();
    }, []);

  return (
    <div>
        
      {/* NFT preview */}
      <div className="text-center mt-10">
        <MediaRenderer
            client={client}
            src="/preview.gif"
            style={{ width: "50%", height: "auto", borderRadius: "10px" }}
        />
      </div>

      <div className="text-gray-500 mt-2">
        {mintedCount}/{totalSupply} NFTs vendus (couleur aléatoire)
      </div>

      <div className="text-center mt-10">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

      {/* Mint section */}
      <div className="flex flex-col m-10">
        {smartAccount ? (
          <div className="text-center">
            <TransactionButton
              transaction={() =>
                claimTo({
                  contract: nftpContract,
                  to: smartAccount.address,
                  quantity: 1n,
                })
              }
              onError={(error: Error) => {
                alert(`Erreur: ${error.message}`);
              }}
              onTransactionConfirmed={async () => {
                alert("Achat réussi !");
              }}
            >
              Acheter le NFT
            </TransactionButton>
            <p className="mb-10">{priceInPol} POL</p>
            <PurchasePage />
            <p>15 Euros</p>
            <p>{priceInEur}</p>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p style={{ textAlign: "center", width: "100%" }}>
              Connectez-vous pour acheter le NFT (euros ou crypto).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
