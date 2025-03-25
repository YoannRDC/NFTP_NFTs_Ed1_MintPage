"use client";
import React, { useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import PurchasePage from "./PurchasePage";
import { client, getProjectPublicKey } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { prepareTransaction, sendTransaction, toWei } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";

interface ItemERC721transfertProps {
  priceInPol: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: "test" | "live";
  previewImage: string;
  redirectPage: string;
  contractType: "erc721drop" | "erc1155drop" | "erc721transfert";
  tokenId: bigint;
  projectName: string;
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
  projectName,
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
  const minterAddress = getProjectPublicKey(projectName);

  // Détermine le statut du NFT : "Disponible" s'il appartient au minter, "Vendu" sinon
  let nftStatus = "Chargement...";
  if (!ownerLoading && owner) {
    nftStatus =
      owner.toLowerCase() === minterAddress.toLowerCase() ? "Disponible" : "Vendu";
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

  // handlePurchase : effectue le paiement en crypto vers l'adresse du minter récupérée dynamiquement,
  // vérifie la confirmation de la transaction et appelle ensuite l'API de transfert du NFT.
  const handlePurchase = async () => {
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
      // Transfert de la crypto vers l'adresse du minter
      const transaction = prepareTransaction({
        to: minterAddress,
        chain: polygon,
        client: client,
        value: toWei(priceInPol.toString()),
        gasPrice: 30000000000n,
      });

      const receipt = await sendTransaction({ transaction, account: smartAccount });
      console.log("Transaction de paiement envoyée:", receipt.transactionHash);

      const paymentTxHash = receipt.transactionHash;

      // Attendre 15 secondes avant d'appeler l'API de transfert du NFT
      await new Promise((resolve) => setTimeout(resolve, 15000));
      console.log("15 secondes écoulées, appel de l'API de transfert");

      // Vérification de la transaction via eth_getTransactionByHash
      const rpcRequest = getRpcClient({ client, chain: polygon });
      const paymentTx = await eth_getTransactionByHash(rpcRequest, {
        hash: paymentTxHash,
      });
      console.log("Détails de la transaction de paiement:", paymentTx);

      if (!paymentTx.blockNumber) {
        throw new Error("La transaction de paiement n'est pas confirmée");
      }
      console.log("Transaction de paiement confirmée :", paymentTxHash);

      // Appel de l'API pour transférer le NFT en passant le hash de la transaction de paiement
      const response = await fetch("/api/transfer-nft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: tokenId.toString(),
          buyerWalletAddress: smartAccount.address,
          nftContractAddress: contract.address,
          blockchainId: 137,
          contractType: contractType,
          paymentTxHash,
          projectName,
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
              La transaction est en cours de traitement ...
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-center" onClick={() => setIsFullscreen(true)} style={{ cursor: "pointer" }}>
        <MediaRenderer
          client={client}
          src={previewImage}
          style={{ height: "auto", borderRadius: "10px" }}
        />
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={previewImage}
            alt="NFT en plein écran"
            className="max-w-full max-h-full"
          />
        </div>
      )}

      <div className="text-gray-500 mt-2 flex justify-center">
        {nftStatus}
      </div>

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
                  onClick={handlePurchase}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Acheter en Crypto
                </button>
                <p className="mb-2">{priceInPol} POL</p>

                <PurchasePage
                  requestedQuantity={1n}
                  amount={Number(priceInEur) * 100}
                  stripeMode={stripeMode}
                  contract={contract}
                  contractType={contractType}
                  redirectPage={redirectPage}
                  tokenId={tokenId}
                  projectName={projectName}
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
      ) : (
        <></>
      )}
    </div>
  );
}
