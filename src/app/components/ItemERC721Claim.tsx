"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import StripePurchasePage from "./StripePurchasePage";
import { client, DistributionType, StripeMode } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { readContract } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc721";

interface ItemERC721ClaimProps {
  totalSupply: number;
  priceInPol: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: StripeMode;
  previewImage: string;
  redirectPage: string;
  distributionType: DistributionType;
  tokenId: bigint;
  projectName: string;
}

export default function ItemERC721Claim({
  totalSupply,
  priceInPol,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
  distributionType,
  tokenId,
  projectName,
}: ItemERC721ClaimProps) {
  const smartAccount = useActiveAccount();
  const [mintedCount, setMintedCount] = useState<number>(0);
  const [requestedQuantity, setrequestedQuantity] = useState<bigint>(1n);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalPricePol = priceInPol !== null ? Number(priceInPol) * Number(requestedQuantity) : 0;
  const totalPriceEur = priceInEur !== null ? Number(priceInEur) * Number(requestedQuantity) : 0;
  const totalPriceEurCents = Math.round(totalPriceEur * 100);
  
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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setrequestedQuantity(BigInt(e.target.value));
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div>
      {/* Aperçu du NFT */}
      <div className="mt-10 flex justify-center">
        <div onClick={toggleModal} style={{ cursor: "pointer" }}>
          <Image
            src={previewImage}
            alt="NFT preview"
            width={400}
            height={400}
            className="rounded-lg"
            style={{ height: "auto" }}
          />
        </div>
      </div>

      {/* Modal plein écran avec bouton de téléchargement */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50"
          onClick={toggleModal}
        >
          <div className="relative w-screen h-screen">
            {/* Bouton télécharger */}
            <a
              href={previewImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded shadow hover:bg-gray-200 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              Télécharger l’image en haute définition
            </a>

            {/* Image plein écran */}
            <Image
              src={previewImage}
              alt="NFT agrandi"
              fill
              sizes="100vw"
              style={{ objectFit: "contain", cursor: "pointer" }}
              className="rounded-none"
              onClick={toggleModal}
            />
          </div>
        </div>
      )}

      <div className="text-gray-500 mt-2 flex justify-center">
        {mintedCount}/{totalSupply} NFT vendu
      </div>

      <div className="text-center mt-10">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

      <div className="flex flex-col m-10">
        {smartAccount ? (
          <div className="text-center">
            <div className="mb-4 hidden">
              <label htmlFor="quantity" className="mr-2">
                Quantity:
              </label>
              <select
                id="quantity"
                value={requestedQuantity.toString()}
                onChange={handleQuantityChange}
                className="border rounded px-2 py-1 text-black"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <TransactionButton
              transaction={async () => {
                return claimTo({
                  contract: contract,
                  to: smartAccount.address,
                  quantity: requestedQuantity,
                });
              }}
              onError={(error: Error) => {
                console.error("Erreur dans la transaction :", error);
                window.location.href = `${redirectPage}?paymentResult=error`;
              }}
              onTransactionConfirmed={() => {
                window.location.href = `${redirectPage}?paymentResult=success`;
              }}
            >
              Acheter en Crypto
            </TransactionButton>

            <p className="mb-2">{totalPricePol} POL</p>

            <StripePurchasePage
              projectName={projectName}
              contract={contract}
              distributionType={distributionType}
              buyerWalletAddress={smartAccount?.address || ""}
              recipientWalletAddressOrEmail={smartAccount?.address || ""}
              tokenId={tokenId}
              requestedQuantity={requestedQuantity}
              paymentPriceFiat={totalPriceEurCents}
              stripeMode={stripeMode}
              redirectPage={redirectPage}
            />
            <p>{totalPriceEur} Euros</p>
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
