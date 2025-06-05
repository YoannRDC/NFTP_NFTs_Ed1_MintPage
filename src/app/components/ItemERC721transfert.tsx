"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ConnectButton,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import {
  client,
  DistributionType,
  getProjectMinterAddress,
  projectMappings,
  StripeMode,
} from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { polygon } from "thirdweb/chains";
import StripePurchasePage from "./StripePurchasePage";
import { performCryptoPaymentAndStoreTxInBdd } from "../utils/cryptoOperation";

interface ItemERC721transfertProps {
  priceInCrypto: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: StripeMode;
  previewImage: string;
  redirectPage: string;
  distributionType: DistributionType;
  buyerWalletAddress: string;
  recipientWalletAddressOrEmail: string;
  tokenId: bigint;
  projectName: string;
  requestedQuantity: string;
  offererName: string;
  chain: any;
}

export default function ItemERC721transfert({
  priceInCrypto,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
  distributionType,
  buyerWalletAddress,
  recipientWalletAddressOrEmail,
  tokenId,
  projectName,
  offererName, 
  chain,
}: ItemERC721transfertProps) {
  const smartAccount = useActiveAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: owner, isPending: ownerLoading } = useReadContract({
    contract,
    method: "function ownerOf(uint256 tokenId) view returns (address)",
    params: [tokenId],
  });

  const minterAddress = getProjectMinterAddress(projectName);

  const nftStatus =
    !ownerLoading && owner
      ? owner.toLowerCase() === minterAddress.toLowerCase()
        ? "Disponible"
        : "Vendu"
      : "Chargement...";

  const wallets = [
    inAppWallet({ auth: { options: ["google", "email", "passkey", "phone"] } }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
  ];

  const parsedPriceCrypto = priceInCrypto !== null ? Number(priceInCrypto) : 0;
  const parsedPriceEur = priceInEur !== null ? Number(priceInEur) : 0;
  const totalPriceEurCents = Math.round(parsedPriceEur * 100);

  const handleCryptoPurchase = async () => {
    if (!smartAccount?.address) {
      console.error("Aucun wallet connecté");
      return;
    }
    if (!parsedPriceCrypto) {
      console.error("Le montant à payer n'est pas défini");
      return;
    }
    try {
      setIsProcessing(true);

      const paymentTxHashCrypto = await performCryptoPaymentAndStoreTxInBdd({
        client,
        chain,
        priceInCrypto: parsedPriceCrypto,
        minterAddress,
        account: smartAccount,
        email: "", // TODO: Add from Mon compte.
        tokenId: tokenId.toString(),
        offererName,
      });

      console.log("Transaction de paiement confirmée :", paymentTxHashCrypto);
      window.location.href = `${redirectPage}?paymentResult=success`;
    } catch (error: any) {
      console.error(error);
      window.location.href = `${redirectPage}?paymentResult=error&errorMessage=${encodeURIComponent(
        error.message || "Erreur inconnue"
      )}`;
    }
  };

  return (
    <div>
      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <p className="text-center text-black">
              La transaction est en cours de traitement...
            </p>
          </div>
        </div>
      )}

      {/* Aperçu de l’image cliquable */}
      <div className="mt-5 flex justify-center cursor-pointer" onClick={() => setIsFullscreen(true)}>
        <p>tokenId: {tokenId.toString()}</p>
        <br/>
        <Image
          src={previewImage}
          alt="NFT Preview"
          width={500}
          height={500}
          placeholder="blur"
          blurDataURL={`${previewImage}?w=10&q=10`}
          className="rounded-lg"
        />
      </div>

      {/* Modal plein écran avec bouton de téléchargement */}
      {isFullscreen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative w-screen h-screen">
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

            <Image
              src={previewImage}
              alt="NFT Fullscreen"
              fill
              sizes="100vw"
              className="rounded-none"
              style={{ objectFit: "contain", cursor: "pointer" }}
              onClick={() => setIsFullscreen(false)}
            />
          </div>
        </div>
      )}

      <div className="text-gray-500 mt-2 flex justify-center">{nftStatus}</div>

      {nftStatus === "Disponible" && (
        <>
          <div className="text-center mt-10">
            <ConnectButton
              client={client}
              wallets={wallets}
              connectModal={{ size: "compact" }}
              locale="fr_FR"
            />
          </div>

          <div className="flex flex-col m-1 mt-10">
            {smartAccount ? (
              <div className="text-center">
                <button
                  onClick={handleCryptoPurchase}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Acheter en Crypto
                </button>
                <p className="mb-2">
                  {parsedPriceCrypto} {projectMappings[projectName as keyof typeof projectMappings].blockchain.nativeSymbol}
                </p>


                <StripePurchasePage
                  projectName={projectName}
                  distributionType={distributionType}
                  buyerWalletAddress={buyerWalletAddress}
                  recipientWalletAddressOrEmail={recipientWalletAddressOrEmail}
                  contract={contract}
                  tokenId={tokenId}
                  requestedQuantity={1n}
                  paymentPriceFiat={totalPriceEurCents}
                  stripeMode={stripeMode}
                  redirectPage={redirectPage}
                  offererName={offererName}
                />
                <p>{parsedPriceEur} Euros</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="w-full">
                  Connectez-vous pour acheter le NFT (euros ou crypto).
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
