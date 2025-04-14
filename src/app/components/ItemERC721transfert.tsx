"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ConnectButton,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import { client, DistributionType, getProjectMinterAddress, StripeMode } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { polygon } from "thirdweb/chains";
import StripePurchasePage from "./StripePurchasePage";
import { performCryptoPayment } from "../utils/cryptoOperation";

interface ItemERC721transfertProps {
  priceInPol: number | string | null;
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
}

export default function ItemERC721transfert({
  priceInPol,
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
  requestedQuantity,
}: ItemERC721transfertProps) {
  const smartAccount = useActiveAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lecture du propriétaire via ownerOf
  const { data: owner, isPending: ownerLoading } = useReadContract({
    contract,
    method: "function ownerOf(uint256 tokenId) view returns (address)",
    params: [tokenId],
  });

  const minterAddress = getProjectMinterAddress(projectName);

  let nftStatus = "Chargement...";
  if (!ownerLoading && owner) {
    nftStatus =
      owner.toLowerCase() === minterAddress.toLowerCase()
        ? "Disponible"
        : "Vendu";
  }

  const wallets = [
    inAppWallet({ auth: { options: ["google", "email", "passkey", "phone"] } }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
  ];

  if (priceInEur === null) {
    throw new Error("Le prix en Euros (priceInEur) doit être défini.");
  }

  const handleCryptoPurchase = async () => {
    if (!smartAccount?.address) {
      console.error("Aucun wallet connecté");
      return;
    }
    if (!priceInPol) {
      console.error("Le montant à payer n'est pas défini");
      return;
    }
    try {
      setIsProcessing(true);

      // Utilisation de la fonction performCryptoPayment depuis utils/cryptoOperations
      const paymentTxHashCrypto = await performCryptoPayment({
        client,
        chain: polygon,
        priceInPol: priceInPol,
        minterAddress: minterAddress,
        account: smartAccount,
      });

      // Vous pouvez ici appeler la fonction d'API de transfert (callBackEndTransferNFT par exemple)
      // ou toute autre action post-transaction.
      console.log("Transaction de paiement confirmée, hash:", paymentTxHashCrypto);

      // Par exemple, appel à l'API pour transférer le NFT...
      // await callBackEndTransferNFT({ ... });

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

      <div
        className="mt-10 flex justify-center cursor-pointer"
        onClick={() => setIsFullscreen(true)}
      >
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

      {isFullscreen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50"
          onClick={() => setIsFullscreen(false)}
        >
          <Image
            src={previewImage}
            alt="NFT Fullscreen"
            width={800}
            height={800}
            className="max-w-full max-h-full"
          />
        </div>
      )}

      <div className="text-gray-500 mt-2 flex justify-center">{nftStatus}</div>

      {nftStatus === "Disponible" ? (
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
                <p className="mb-2">{priceInPol} POL</p>

                <StripePurchasePage
                  projectName={projectName}
                  distributionType={distributionType}
                  buyerWalletAddress={buyerWalletAddress}
                  recipientWalletAddressOrEmail={recipientWalletAddressOrEmail}
                  contract={contract}
                  tokenId={tokenId}
                  requestedQuantity={1n}
                  paymentPriceFiat={Number(priceInEur) * 100}
                  stripeMode={stripeMode}
                  redirectPage={redirectPage}
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
        </>
      ) : null}
    </div>
  );
}
