"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import Image from "next/image";
import {
  ConnectButton,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import StripePurchasePage from "./StripePurchasePage";
import { client, DistributionType, getProjectMinterAddress, StripeMode } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { prepareTransaction, sendTransaction, toWei } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";

interface ItemERC721transfertProps {
  priceInPol: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: StripeMode;
  previewImage: string;
  redirectPage: string;
  distributionType: DistributionType;
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
  tokenId,
  projectName,
  requestedQuantity,
}: ItemERC721transfertProps) {
  const smartAccount = useActiveAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Récupération du propriétaire du token via ownerOf
  const { data: owner, isPending: ownerLoading } = useReadContract({
    contract,
    method: "function ownerOf(uint256 tokenId) view returns (address)",
    params: [tokenId],
  });

  // Récupération de l'adresse du minter via le mapping à partir du projectName
  const minterAddress = getProjectMinterAddress(projectName);

  // Déterminer le statut du NFT : "Disponible" s'il appartient au minter, "Vendu" sinon
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

  // handlePurchase : effectue le paiement en crypto vers l'adresse du minter,
  // attend la confirmation et appelle l'API de transfert du NFT.
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
      // Préparation de la transaction de paiement
      const transaction = prepareTransaction({
        to: minterAddress,
        chain: polygon,
        client: client,
        value: toWei(priceInPol.toString()),
        gasPrice: 30000000000n,
      });

      const receipt = await sendTransaction({ transaction, account: smartAccount });
      console.log("Transaction de paiement envoyée:", receipt.transactionHash);

      const paymentTxHashCrypto = receipt.transactionHash;

      // Attente de 15 secondes avant d'appeler l'API de transfert
      await new Promise((resolve) => setTimeout(resolve, 15000));
      console.log("15 secondes écoulées, appel de l'API de transfert");

      // Vérification de la transaction
      const rpcRequest = getRpcClient({ client, chain: polygon });
      const paymentTx = await eth_getTransactionByHash(rpcRequest, {
        hash: paymentTxHashCrypto,
      });
      console.log("Détails de la transaction de paiement:", paymentTx);

      if (!paymentTx.blockNumber) {
        throw new Error("La transaction de paiement n'est pas confirmée");
      }
      console.log("Transaction de paiement confirmée :", paymentTxHashCrypto);

      // Appel de l'API pour transférer le NFT
      const response = await fetch("/api/crypto-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          distributionType: distributionType,
          buyerWalletAddress: smartAccount.address,
          recipientWalletAddress: smartAccount.address,
          nftContractAddress: contract.address,
          blockchainId: 137,
          tokenId: tokenId.toString(),
          requestedQuantity: requestedQuantity,
          paymentTxHashCrypto: paymentTxHashCrypto,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du transfert NFT");
      }
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

      {/* Image de prévisualisation avec Next.js Image, lazy loading et placeholder flou */}
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

      {/* Vue en plein écran lors du clic */}
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
