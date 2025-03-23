"use client";
import React from "react";
import {
  ConnectButton,
  MediaRenderer,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import PurchasePage from "./PurchasePage";
import { client, minterAddress } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { prepareTransaction, sendTransaction, toWei } from "thirdweb";
import { polygon, polygonAmoy } from "thirdweb/chains";
import { getRpcClient, eth_getTransactionByHash } from "thirdweb/rpc";

interface ItemERC721transfertProps {
  totalSupply: number;
  priceInPol: number | string | null; // Montant attendu en crypto (exprimé en ETH ou MATIC)
  priceInEur: number | string | null;
  contract: any;
  stripeMode: "test" | "live";
  previewImage: string;
  redirectPage: string;
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

  // Récupération du propriétaire du token via ownerOf
  const { data: owner, isPending: ownerLoading } = useReadContract({
    contract,
    method: "function ownerOf(uint256 tokenId) view returns (address)",
    params: [tokenId],
  });

  // Détermine le statut du NFT : "Disponible" s'il appartient à minterAddress, "Vendu" sinon
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

  // handlePurchase : effectue d'abord le paiement en crypto vers minterAddress,
  // puis vérifie que la transaction est confirmée via eth_getTransactionByHash.
  // Si c'est le cas, l'appel API de transfert du NFT est lancé.
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
      // Transfert de la crypto vers minterAddress
      const transaction = prepareTransaction({
        to: minterAddress,
        chain: polygon,
        client: client,
        value: toWei(priceInPol.toString()),
        gasPrice: 30000000000n,
      });
      
      const receipt = await sendTransaction({ transaction, account: smartAccount });
      console.log("Transaction de paiement envoyée:", receipt.transactionHash);

      // Récupération du hash de la transaction de paiement
      const paymentTxHash = receipt.transactionHash;
      
      // Vérification de la transaction via eth_getTransactionByHash
      const rpcRequest = getRpcClient({ client, chain: polygon });
      const paymentTx = await eth_getTransactionByHash(rpcRequest, {
        hash: paymentTxHash,
      });
      console.log("Détails de la transaction de paiement:", paymentTx);

      // Vérifier que la transaction est confirmée (ex. présence de blockNumber)
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
          nftContractAddress: contract.address, // L'adresse du contrat NFT
          blockchainId: 137, // ou la chaîne appropriée
          contractType: contractType,
          paymentTxHash, // Hash de la transaction de paiement
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du transfert NFT");
      }
      window.location.href = `${redirectPage}?paymentResult=success`;
    } catch (error: any) {
      console.error(error);
      window.location.href = `${redirectPage}?paymentResult=error&errorMessage=${encodeURIComponent(error.message || "Erreur inconnue")}`;
    }
  };

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
            <button
              onClick={handlePurchase}
              disabled={nftStatus === "Vendu"}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Acheter en Crypto
            </button>
            <p className="mb-2">{priceInPol} POL</p>

            {/* Ne pas modifier PurchasePage (fonctionnalité Stripe distincte) */}
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
