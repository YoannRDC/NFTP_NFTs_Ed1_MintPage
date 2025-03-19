"use client";

import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  TransactionButton,
  useActiveAccount,
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
  tokenId
}: ItemERC721transfertProps) {
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

  if (priceInEur === null) {
    throw new Error("Le prix en Euros (priceInEur) doit être défini.");
  }

  // Récupérer le nombre total de NFTs mintés
  useEffect(() => {
    const fetchTotalMinted = async () => {
      try {
        const totalMinted = await readContract({
          contract: contract,
          method: "function totalMinted() view returns (uint256)",
          params: [],
        });
        setMintedCount(Number(totalMinted));
      } catch (error) {
        console.error("Erreur lors de la récupération du total minted :", error);
      }
    };
    fetchTotalMinted();
  }, [contract]);

  return (
    <div>
      {/* Aperçu du NFT */}
      <div className="mt-10 flex justify-center">
        <MediaRenderer
          client={client}
          src={previewImage}  // Utilisation de la prop passée en paramètre
          style={{ height: "auto", borderRadius: "10px" }}
        />
      </div>

      <div className="text-gray-500 mt-2 flex justify-center">
        {mintedCount} NFT vendu
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
            <TransactionButton
              transaction={() =>
                prepareContractCall({
                  contract,
                  method:
                    "function safeTransferFrom(address from, address to, uint256 tokenId)",
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
