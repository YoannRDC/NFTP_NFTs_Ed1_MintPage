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

// Définition de l'interface pour les props
interface ItemERC721Props {
  totalSupply: number;
  priceInPol: number | string | null;
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
  // State pour la quantité sélectionnée, initialisée à 1
  const [selectedQuantity, setSelectedQuantity] = useState<bigint>(1n);

  // Calcul des prix totaux en fonction de la quantité sélectionnée
  const totalPricePol =
    (priceInPol !== null && priceInPol !== undefined
      ? typeof priceInPol === "number"
        ? priceInPol
        : parseFloat(priceInPol)
      : 0) * Number(selectedQuantity);

  const totalPriceEur =
    (priceInEur !== null && priceInEur !== undefined
      ? typeof priceInEur === "number"
        ? priceInEur
        : parseFloat(priceInEur)
      : 0) * Number(selectedQuantity);

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

  // Récupérer le nombre total de NFTs mintés
  useEffect(() => {
    const fetchTotalMinted = async () => {
      try {
        const totalMinted = await readContract({
          contract: nftpNftsEd1Contract,
          method: "function totalMinted() view returns (uint256)",
          params: [],
        });
        setMintedCount(Number(totalMinted));
      } catch (error) {
        console.error("Erreur lors de la récupération du total minted :", error);
      }
    };

    fetchTotalMinted();
  }, []);

  // Handler pour mettre à jour la quantité sélectionnée
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedQuantity(BigInt(e.target.value));
  };

  return (
    <div>
      {/* Aperçu NFT */}
      <div className="mt-10 flex justify-center">
        <MediaRenderer
          client={client}
          src="/preview.gif"
          style={{ width: "50%", height: "auto", borderRadius: "10px" }}
        />
      </div>

      <div className="text-gray-500 mt-2 flex justify-center">
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

      {/* Section Mint */}
      <div className="flex flex-col m-10">
        {smartAccount ? (
          <div className="text-center">
            {/* Sélecteur de quantité */}
            <div className="mb-4 hidden">
              <label htmlFor="quantity" className="mr-2">
                Quantity:
              </label>
              <select
                id="quantity"
                value={selectedQuantity.toString()}
                onChange={handleQuantityChange}
                className="border rounded px-2 py-1 text-black"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
            </div>

            <TransactionButton
              transaction={() =>
                claimTo({
                  contract: nftpContract,
                  to: smartAccount.address,
                  quantity: selectedQuantity,
                })
              }
              onError={(error: Error) => {
                alert(`Erreur: ${error.message}`);
              }}
              onTransactionConfirmed={async () => {
                alert("Achat réussi !");
              }}
            >
              Acheter en Crypto
            </TransactionButton>
            <p className="mb-2">{totalPricePol} POL</p>
            <PurchasePage />
            <p>{totalPriceEur} Euros</p>
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
