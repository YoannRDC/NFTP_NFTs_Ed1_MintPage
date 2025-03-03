"use client";

import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import PurchasePage from "./PurchasePage";
import { client } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { readContract } from "thirdweb";
import { safeTransferFrom } from "thirdweb/extensions/erc1155";
import { convertPriceInPolToWei } from "../utils/conversion";

// Définition de l'interface pour les props
interface ItemERC721Props {
  totalSupply: number;
  priceInPol: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: "test" | "live";
  previewImage: string; // Nouvelle prop pour l'image de preview
  redirectPage: string; // Nouvelle prop pour la page de redirection
}

export default function ItemERC721({
  totalSupply,
  priceInPol,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
}: ItemERC721Props) {
  const smartAccount = useActiveAccount();
  const [mintedCount, setMintedCount] = useState<number>(0);
  // Quantité sélectionnée, initialisée à 1
  const [requestedQuantity, setrequestedQuantity] = useState<bigint>(1n);

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

  // Récupérer le nombre total de NFTs mintés
  useEffect(() => {
    const fetchTotalMinted = async () => {
      try {
        const totalMinted = await readContract({
          contract: contract,
          method: "function totalSupply() view returns (uint256)",
          params: [],
        });
        setMintedCount(Number(totalMinted));
      } catch (error) {
        console.error("Erreur lors de la récupération du total minted :", error);
      }
    };
    fetchTotalMinted();
  }, [contract]);

  // Mise à jour de la quantité sélectionnée
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setrequestedQuantity(BigInt(e.target.value));
  };

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

      {/* Section Mint */}
      <div className="flex flex-col m-10">
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
                  from: "0x6debf5C015f0Edd3050cc919A600Fb78281696B9", // Adresse qui détient le token (par exemple, votre adresse de pré-mint)
                  to: smartAccount.address, // Adresse de l'acheteur (connectée)
                  tokenId: 1n, // L'identifiant du token à transférer
                  value: requestedQuantity, // Quantité de token à transférer (par exemple, 1 exemplaire)
                  data: "0x", // Données supplémentaires (souvent vide)
                  overrides: {
                    // Ici, vous définissez le prix du NFT en wei (attention au format BigInt)
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
