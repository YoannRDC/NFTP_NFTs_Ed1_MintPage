"use client";

import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  TransactionButton,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import PurchasePage from "./PurchasePage";
import { client, minterAddress } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { prepareContractCall, readContract } from "thirdweb";

// Définition de l'interface pour les props
interface ItemERC721transfertProps {
  totalSupply: number;
  priceInPol: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: "test" | "live";
  previewImage: string; // Nouvelle prop pour l'image de preview
  redirectPage: string; // Nouvelle prop pour la page de redirection
  contractType: "erc721drop" | "erc1155drop" | "erc721transfert";
  tokenId: bigint;
}

export default function ItemERC721transfert({
  priceInPol,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
  contractType,
  tokenId,
  totalSupply,
}: ItemERC721transfertProps) {
  const smartAccount = useActiveAccount();
  const [soldCount, setSoldCount] = useState<number>(0);

  // Configuration des wallets
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

  if (priceInEur === null) {
    throw new Error("Le prix en Euros (priceInEur) doit être défini.");
  }

  /**
   * Récupère le nombre de NFT vendus en se basant sur la propriété ownerOf :
   * - On appelle totalMinted() pour connaître le nombre de tokens réellement mintés
   * - Pour chaque token [0..totalMinted-1], on vérifie si ownerOf(tokenId) != minterAddress
   * - On incrémente le compteur soldCount si c'est différent
   */
  useEffect(() => {
    const fetchSoldCount = async () => {
      try {
        // 1) Récupérer le nombre de tokens mintés
        const totalMinted = await readContract({
          contract,
          method: "function totalMinted() view returns (uint256)",
          params: [],
        });

        let sold = 0;
        // 2) Pour chaque token, on appelle ownerOf
        for (let i = 0; i < Number(totalMinted); i++) {
          const owner = await readContract({
            contract,
            method: "function ownerOf(uint256 tokenId) view returns (address)",
            params: [BigInt(i)],
          });
          // 3) Si l'adresse est différente du minterAddress, on considère que le NFT est vendu
          if (owner?.toLowerCase() !== minterAddress.toLowerCase()) {
            sold++;
          }
        }
        setSoldCount(sold);
      } catch (error) {
        console.error("Erreur lors de la récupération du total minted ou du ownerOf :", error);
      }
    };
    fetchSoldCount();
  }, [contract]);

  return (
    <div>
      {/* Aperçu du NFT */}
      <div className="mt-10 flex justify-center">
        <MediaRenderer
          client={client}
          src={previewImage}
          style={{ height: "auto", borderRadius: "10px" }}
        />
      </div>

      {/* Affiche le nombre de NFT vendus */}
      <div className="text-gray-500 mt-2 flex justify-center">
        {soldCount} NFT vendu
      </div>

      {/* Bouton de connexion */}
      <div className="text-center mt-10">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

      {/* Section d'achat (crypto ou euros) */}
      <div className="flex flex-col m-10">
        {smartAccount ? (
          <div className="text-center">
            <TransactionButton
              transaction={() =>
                prepareContractCall({
                  contract,
                  method: "function safeTransferFrom(address from, address to, uint256 tokenId)",
                  params: [minterAddress, smartAccount.address, tokenId],
                })
              }
              onError={(error: Error) => {
                console.error(error);
                window.location.href = `${redirectPage}?paymentResult=error`;
              }}
              onTransactionConfirmed={async () => {
                window.location.href = `${redirectPage}?paymentResult=success`;
              }}
            >
              Acheter en Crypto
            </TransactionButton>
            <p className="mb-2">{priceInPol} POL</p>

            <PurchasePage
              requestedQuantity={1n}
              amount={Number(priceInEur)}
              stripeMode={stripeMode}
              contract={contract}
              contractType={contractType}
              redirectPage={redirectPage}
              tokenId={tokenId}
            />
            <p>{priceInEur} Euros</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="w-full">
              Connectez-vous pour acheter le NFT (euros ou crypto).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
