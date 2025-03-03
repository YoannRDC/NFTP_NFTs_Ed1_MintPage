"use client";

import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { client, nftpPubKey } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { readContract } from "thirdweb";
import { safeTransferFrom } from "thirdweb/extensions/erc1155";
import { convertPriceInPolToWei } from "../utils/conversion";
import PurchasePage from "./PurchasePage";

interface ItemERC721Props {
  tokenId: bigint; // Nouveau paramètre pour le tokenId
  priceInPol: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: "test" | "live";
  previewImage: string; // Image de preview
  redirectPage: string; // Page de redirection après transaction
  contractType: "erc721drop" | "erc721collection" | "erc1155drop" | "erc1155edition";
}

export default function ItemERC1155({
  tokenId,
  priceInPol,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
  contractType
}: ItemERC721Props) {
  const smartAccount = useActiveAccount();
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [soldCount, setSoldCount] = useState<number>(0);
  // Quantité sélectionnée, initialisée à 1
  const [requestedQuantity, setrequestedQuantity] = useState<bigint>(1n);

  // Adresse qui détient initialement tous les NFT (pré-mint)
  const sellerAddress = nftpPubKey;

  // Calcul du prix total en POL et en EUR (par unité multiplié par la quantité)
  const totalPricePol =
    (priceInPol !== null && priceInPol !== undefined
      ? typeof priceInPol === "number"
        ? priceInPol
        : parseFloat(priceInPol)
      : 0) * Number(requestedQuantity);

  const totalPriceEur =
    (priceInEur !== null && priceInEur !== undefined
      ? typeof priceInEur === "number"
        ? priceInEur
        : parseFloat(priceInEur)
      : 0) * Number(requestedQuantity);

  // Conversion du prix total en Euros en centimes pour Stripe
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

  // Récupérer le total supply et la balance de l'adresse pré-mint pour calculer le nombre vendu
  useEffect(() => {
    const fetchSupplyAndSold = async () => {
      try {
        // Récupère le total supply pour le token donné
        const totalMinted = await readContract({
          contract: contract,
          method: "function totalSupply(uint256 tokenId) view returns (uint256)",
          params: [tokenId],
        });
        const total = Number(totalMinted);
        setTotalSupply(total);

        // Récupère le solde de l'adresse pré-mint pour le token donné
        const sellerBalance = await readContract({
          contract: contract,
          method: "function balanceOf(address account, uint256 id) view returns (uint256)",
          params: [sellerAddress, tokenId],
        });
        const sellerBal = Number(sellerBalance);

        // Le nombre vendu correspond au total pré-minté moins les tokens encore détenus par le vendeur
        const sold = total - sellerBal;
        setSoldCount(sold);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des informations sur la supply et le nombre vendu :",
          error
        );
      }
    };
    fetchSupplyAndSold();
  }, [contract, tokenId]);

  // Mise à jour de la quantité sélectionnée
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setrequestedQuantity(BigInt(e.target.value));
  };

  // État pour contrôler l'affichage de l'image en grand (modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="border p-4 rounded-lg shadow-lg text-center">
      {/* Aperçu du NFT */}
      <div className="mt-10 flex justify-center">
        <div onClick={toggleModal} style={{ cursor: "pointer" }}>
          <MediaRenderer
            client={client}
            src={previewImage} // Image de preview passée en prop
            style={{ height: "auto", borderRadius: "10px" }}
          />
        </div>
      </div>
      {/* Modal pour l'affichage en grand de l'image */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
          onClick={toggleModal}
        >
          <img
            src={previewImage}
            alt="NFT agrandi"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}

      {/* Affichage du nombre vendu / total supply */}
      <div className="text-gray-500 mt-2 flex justify-center">
        {soldCount}/{totalSupply} NFT vendu
      </div>

      <div className="text-center mt-5">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

      {/* Section Mint / Vente */}
      <div className="flex flex-col m-2">
        {smartAccount ? (
          <div className="text-center">
            {/* Sélecteur de quantité (actuellement masqué) */}
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
                safeTransferFrom({
                  contract: contract,
                  from: sellerAddress, // Adresse détentrice des NFT pré-mintés
                  to: smartAccount.address, // Adresse de l'acheteur
                  tokenId: tokenId, // Utilisation de la prop tokenId
                  value: requestedQuantity, // Quantité de token à transférer
                  data: "0x", // Données supplémentaires
                  overrides: {
                    // Définir le prix du NFT en wei
                    value: convertPriceInPolToWei(totalPricePol),
                  },
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

            <p className="mb-2">{totalPricePol} POL</p>
            <PurchasePage
              requestedQuantity={requestedQuantity}
              amount={totalPriceEurCents}
              stripeMode={stripeMode}
              contract={contract}
              contractType={contractType}
              redirectPage={redirectPage}
              tokenId={tokenId}
            />
            <p>{totalPriceEur} Euros</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="w-full text-sm">
              Connectez-vous pour acheter le NFT (euros ou crypto).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
