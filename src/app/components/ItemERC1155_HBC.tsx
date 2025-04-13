"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import {
  client,
  DistributionType,
  getProjectMinterAddress,
  StripeMode,
} from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { readContract } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc1155";
import StripePurchasePage from "./StripePurchasePage";

interface ItemERC1155_HBCProps {
  priceInPol: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: StripeMode;
  previewImage: string; // Image de preview
  redirectPage: string; // Page de redirection après transaction
  distributionType: DistributionType;
  tokenId: bigint;
  projectName: string;
}

export default function ItemERC1155({
  priceInPol,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
  distributionType,
  tokenId,
  projectName,
}: ItemERC1155_HBCProps) {
  const smartAccount = useActiveAccount();
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [soldCount, setSoldCount] = useState<number>(0);
  // Quantité sélectionnée, initialisée à 1
  const [requestedQuantity, setrequestedQuantity] = useState<bigint>(1n);

  // États pour la méthode d'envoi du NFT
  const [selectedOption, setSelectedOption] = useState<"myWallet" | "walletAddress" | "email">("myWallet");
  const [customWalletAddress, setCustomWalletAddress] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");

  // Ici nous générons un nom de groupe unique grâce au tokenId pour que chaque composant ait ses propres radio boutons
  const radioGroupName = `deliveryMethod-${tokenId.toString()}`;

  const NextImage = dynamic(() => import("next/image"), { ssr: false });

  // Récupération de l'adresse du minter via le mapping à partir du projectName
  const minterAddress = getProjectMinterAddress(projectName);

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
          params: [minterAddress, tokenId],
        });
        const sellerBal = Number(sellerBalance);
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
  }, [contract, tokenId, minterAddress]);

  // Mise à jour de la quantité sélectionnée
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setrequestedQuantity(BigInt(e.target.value));
  };

  // État pour contrôler l'affichage de l'image en grand (modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Fonction pour gérer la logique d'envoi par email
  const handleEmailClaim = async () => {
    if (!recipientEmail) {
      throw new Error("Veuillez saisir un email valide.");
    }
    console.log("Envoi d'un code unique à :", recipientEmail);
    window.location.href = `${redirectPage}?paymentResult=success`;
  };

  return (
    <div className="">
      {/* Aperçu du NFT */}
      <div className="mt-10 flex justify-center">
        <div onClick={toggleModal} style={{ cursor: "pointer" }}>
          <MediaRenderer
            client={client}
            src={previewImage}
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
          <div className="relative w-full h-full max-w-3xl max-h-full">
            <NextImage
              src={previewImage}
              alt="NFT agrandi"
              fill
              style={{ objectFit: "contain" }}
              className="rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Affichage du nombre vendu / total supply */}
      <div className="text-gray-500 mt-2 flex justify-center">
        {soldCount}/{totalSupply} cakes offered
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

            {/* Boutons radio pour sélectionner le destinataire */}
            <div className="my-4 text-left">
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name={radioGroupName}
                    className="mr-2"
                    checked={selectedOption === "myWallet"}
                    onChange={() => setSelectedOption("myWallet")}
                  />
                  Send to my wallet
                </label>
              </div>
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name={radioGroupName}
                    className="mr-2"
                    checked={selectedOption === "walletAddress"}
                    onChange={() => setSelectedOption("walletAddress")}
                  />
                  Send to this wallet address
                </label>
                {selectedOption === "walletAddress" && (
                  <input
                    type="text"
                    placeholder="0x..."
                    value={customWalletAddress}
                    onChange={(e) => setCustomWalletAddress(e.target.value)}
                    pattern="^0x[a-fA-F0-9]{40}$"
                    className="border rounded px-2 py-1 text-black mt-2 w-full"
                  />
                )}
              </div>
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name={radioGroupName}
                    className="mr-2"
                    checked={selectedOption === "email"}
                    onChange={() => setSelectedOption("email")}
                  />
                  Send to an email
                </label>
                {selectedOption === "email" && (
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="border rounded px-2 py-1 text-black mt-2 w-full"
                  />
                )}
              </div>
            </div>

            {/* Utilisation conditionnelle du bouton suivant la méthode choisie */}
            {selectedOption === "email" ? (
              <button
                onClick={async () => {
                  try {
                    await handleEmailClaim();
                  } catch (error) {
                    console.error(error);
                    const errorMessage = encodeURIComponent((error as Error).message);
                    window.location.href = `${redirectPage}?paymentResult=error&errorMessage=${errorMessage}`;
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Acheter par Email
              </button>
            ) : (
              <TransactionButton
                transaction={async () => {
                  if (selectedOption === "walletAddress") {
                    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
                    if (!walletRegex.test(customWalletAddress)) {
                      throw new Error("Adresse de wallet non valide.");
                    }
                    return claimTo({
                      contract: contract,
                      to: customWalletAddress,
                      tokenId: tokenId,
                      quantity: BigInt(requestedQuantity),
                    });
                  } else {
                    return claimTo({
                      contract: contract,
                      to: smartAccount.address,
                      tokenId: tokenId,
                      quantity: BigInt(requestedQuantity),
                    });
                  }
                }}
                onError={(error: Error) => {
                  console.error(error);
                  const errorMessage = encodeURIComponent(error.message);
                  window.location.href = `${redirectPage}?paymentResult=error&errorMessage=${errorMessage}`;
                }}
                onTransactionConfirmed={async () => {
                  window.location.href = `${redirectPage}?paymentResult=success`;
                }}
              >
                Acheter en Crypto
              </TransactionButton>
            )}

            <p className="mb-2">{totalPricePol} POL</p>

            <StripePurchasePage
              projectName={projectName}
              distributionType={distributionType}
              contract={contract}
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
            <p className="w-full text-sm">
              Connectez-vous pour acheter le NFT (euros ou crypto).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
