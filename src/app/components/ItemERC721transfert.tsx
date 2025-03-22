"use client";
import React from "react";
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
import { prepareContractCall } from "thirdweb";

// Définition de l'interface pour les props
interface ItemERC721transfertProps {
  totalSupply: number;
  priceInPol: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: "test" | "live";
  previewImage: string; // Image de preview
  redirectPage: string; // Page de redirection
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
}: ItemERC721transfertProps) {
  const smartAccount = useActiveAccount();

  // Utilisation de useReadContract pour récupérer le propriétaire du token
  const { data: owner, isPending: ownerLoading } = useReadContract({
    contract,
    method: "function ownerOf(uint256 tokenId) view returns (address)",
    params: [tokenId],
  });

  // Le NFT est "Disponible" s'il appartient à minterAddress, "Vendu" sinon
  let nftStatus = "Chargement...";
  if (!ownerLoading && owner) {
    nftStatus =
      owner.toLowerCase() === minterAddress.toLowerCase()
        ? "Disponible"
        : "Vendu";
  }

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

      {/* Affichage du statut : Disponible ou Vendu */}
      <div className="text-gray-500 mt-2 flex justify-center">
        {nftStatus}
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

      {/* Section Achat */}
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
              disabled={nftStatus === "Vendu"}
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
