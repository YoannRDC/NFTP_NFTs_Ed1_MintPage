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
  NFTrecipient,
  StripeMode,
} from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { readContract } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc1155";
import StripePurchasePage from "./StripePurchasePage";
import { performCryptoPayment } from "../utils/cryptoOperation";
import { polygon } from "thirdweb/chains";
import { callBackEndTransferNFT } from "../utils/backendCalls";
import TestEmailButton from "./Test_callSendEmail";

interface ItemERC1155_HBCProps {
  priceInPol: number;
  priceInEur: number;
  contract: any;
  stripeMode: StripeMode;
  previewImage: string; // Image de preview
  redirectPage: string; // Page de redirection après transaction
  distributionType: DistributionType;
  tokenId: bigint;
  projectName: string;
  blockchainId: number; 
}

export default function ItemERC1155_HBC({
  priceInPol,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
  distributionType,
  tokenId,
  projectName,
  blockchainId,
}: ItemERC1155_HBCProps) {
  const smartAccount = useActiveAccount();
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [soldCount, setSoldCount] = useState<number>(0);
  // Quantité sélectionnée, initialisée à 1
  const [requestedQuantity, setRequestedQuantity] = useState<bigint>(1n);

  // États pour la méthode d'envoi du NFT
  const [selectedOption, setSelectedOption] = useState<NFTrecipient>(NFTrecipient.BuyerAddress);
  const [specificWalletAddress, setSpecificWalletAddress] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");

  // Un nom de groupe unique pour les boutons radio (basé sur le tokenId)
  const radioGroupName = `deliveryMethod-${tokenId.toString()}`;

  const NextImage = dynamic(() => import("next/image"), { ssr: false });

  // Récupération de l'adresse du minter via le mapping selon projectName
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

  // Récupération des informations de supply et du nombre de NFT vendus
  useEffect(() => {
    const fetchSupplyAndSold = async () => {
      try {
        // Récupère le total supply pour ce token
        const totalMinted = await readContract({
          contract: contract,
          method: "function totalSupply(uint256 tokenId) view returns (uint256)",
          params: [tokenId],
        });
        const total = Number(totalMinted);
        setTotalSupply(total);

        // Récupère la balance de l'adresse pré-mint et calcule le nombre vendu
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
    setRequestedQuantity(BigInt(e.target.value));
  };

  // État pour contrôler l'affichage de l'image en mode modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  // Calcul de l'adresse (ou de l'email) destinataire à utiliser dans la transaction
  const recipientWalletAddressOrEmail = (() => {
    if (selectedOption === NFTrecipient.BuyerAddress) {
      return smartAccount?.address;
    } else if (selectedOption === NFTrecipient.SpecificWallet) {
      return specificWalletAddress;
    } else if (selectedOption === NFTrecipient.Email) {
      return recipientEmail;
    }
    return smartAccount?.address || "";
  })();

  // Handler pour le paiement crypto lorsque l'option "Email" est sélectionnée
  const handleEmailCryptoPayment = async () => {
    if (!smartAccount) {
      console.error("Aucun smartAccount actif");
      return; // Ou déclencher une alerte, rediriger, etc.
    }
    if (!smartAccount || !recipientWalletAddressOrEmail) {
      console.error("Recipient email is not defined");
      return; // Ou déclencher une alerte, rediriger, etc.
    }

    try {
      const paymentTxHash = await performCryptoPayment({
        client,
        chain: polygon,
        priceInPol: priceInPol,
        minterAddress: minterAddress,
        account: smartAccount,
      });

      if (paymentTxHash !== "") {
        // Paiement confirmé : on appelle le callback côté backend pour transférer le NFT
        await callBackEndTransferNFT({
          projectName,
          distributionType,
          buyerWalletAddress: smartAccount.address,
          recipientWalletAddressOrEmail: recipientWalletAddressOrEmail,
          nftContractAddress: contract.address,
          blockchainId,
          tokenId: tokenId.toString(),
          requestedQuantity: requestedQuantity.toString(),
          paymentTxHashCrypto: paymentTxHash,
        });
        window.location.href = `${redirectPage}?paymentResult=success`;
      } else {
        throw new Error("La transaction de paiement n'a pas été confirmée");
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = encodeURIComponent(error.message);
      window.location.href = `${redirectPage}?paymentResult=error&errorMessage=${errorMessage}`;
    }
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
      {/* Modal pour affichage agrandi */}
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

            {/* Boutons radio pour choisir le destinataire */}
            <div className="my-4 text-left">
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name={radioGroupName}
                    className="mr-2"
                    checked={selectedOption === NFTrecipient.BuyerAddress}
                    onChange={() => setSelectedOption(NFTrecipient.BuyerAddress)}
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
                    checked={selectedOption === NFTrecipient.SpecificWallet}
                    onChange={() => setSelectedOption(NFTrecipient.SpecificWallet)}
                  />
                  Send to this wallet address
                </label>
                {selectedOption === NFTrecipient.SpecificWallet && (
                  <input
                    type="text"
                    placeholder="0x..."
                    value={specificWalletAddress}
                    onChange={(e) => setSpecificWalletAddress(e.target.value)}
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
                    checked={selectedOption === NFTrecipient.Email}
                    onChange={() => setSelectedOption(NFTrecipient.Email)}
                  />
                  Send to an email
                </label>
                {selectedOption === NFTrecipient.Email && (
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

            {/* Bouton de paiement crypto */}
            <div className="mb-4">
              {selectedOption === NFTrecipient.Email ? (
                // Bouton personnalisé pour l'option Email
                <button
                  onClick={handleEmailCryptoPayment}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Acheter en Crypto
                </button>
              ) : (
                // TransactionButton pour les options Buyer et Specific Wallet
                <TransactionButton
                  transaction={async () => {
                    if (selectedOption === NFTrecipient.BuyerAddress) {
                      return claimTo({
                        contract: contract,
                        to: smartAccount.address,
                        tokenId: tokenId,
                        quantity: BigInt(requestedQuantity),
                      });
                    } else if (selectedOption === NFTrecipient.SpecificWallet) {
                      const walletRegex = /^0x[a-fA-F0-9]{40}$/;
                      if (!walletRegex.test(specificWalletAddress)) {
                        throw new Error("Adresse de wallet non valide.");
                      }
                      return claimTo({
                        contract: contract,
                        to: specificWalletAddress,
                        tokenId: tokenId,
                        quantity: BigInt(requestedQuantity),
                      });
                    }
                    // Cas de secours (rarement atteint)
                    return claimTo({
                      contract: contract,
                      to: smartAccount.address,
                      tokenId: tokenId,
                      quantity: BigInt(requestedQuantity),
                    });
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
            </div>

            <p className="mb-2">{totalPricePol} POL</p>

            <StripePurchasePage
              projectName={projectName}
              distributionType={distributionType}
              buyerWalletAddress={smartAccount.address}
              recipientWalletAddressOrEmail={recipientWalletAddressOrEmail ?? ""}
              contract={contract}
              tokenId={tokenId}
              requestedQuantity={requestedQuantity}
              paymentPriceFiat={totalPriceEurCents}
              stripeMode={stripeMode}
              redirectPage={redirectPage}
            />
            <p>{totalPriceEur} Euros</p>
            <br></br>
            <div>
              <TestEmailButton/>
            </div>
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
