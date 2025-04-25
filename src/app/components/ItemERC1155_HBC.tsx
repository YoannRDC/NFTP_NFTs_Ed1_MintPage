"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  ConnectButton,
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
  previewImage: string;
  redirectPage: string;
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
  const [requestedQuantity, setRequestedQuantity] = useState<bigint>(1n);
  const [selectedOption, setSelectedOption] = useState<NFTrecipient>(NFTrecipient.BuyerAddress);
  const [specificWalletAddress, setSpecificWalletAddress] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");

  const radioGroupName = `deliveryMethod-${tokenId.toString()}`;
  const minterAddress = getProjectMinterAddress(projectName);

  const totalPricePol = (priceInPol ?? 0) * Number(requestedQuantity);
  const totalPriceEur = (priceInEur ?? 0) * Number(requestedQuantity);
  const totalPriceEurCents = Math.round(totalPriceEur * 100);

  const wallets = [
    inAppWallet({ auth: { options: ["google", "email", "passkey", "phone"] } }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
  ];

  useEffect(() => {
    const fetchSupplyAndSold = async () => {
      try {
        const totalMinted = await readContract({
          contract: contract,
          method: "function totalSupply(uint256 tokenId) view returns (uint256)",
          params: [tokenId],
        });
        setTotalSupply(Number(totalMinted));

        const sellerBalance = await readContract({
          contract: contract,
          method: "function balanceOf(address account, uint256 id) view returns (uint256)",
          params: [minterAddress, tokenId],
        });
        setSoldCount(Number(totalMinted) - Number(sellerBalance));
      } catch (error) {
        console.error("Erreur lors de la récupération du supply :", error);
      }
    };

    fetchSupplyAndSold();
  }, [contract, tokenId, minterAddress]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRequestedQuantity(BigInt(e.target.value));
  };

  const recipientWalletAddressOrEmail = selectedOption === NFTrecipient.BuyerAddress
    ? smartAccount?.address
    : selectedOption === NFTrecipient.SpecificWallet
      ? specificWalletAddress
      : recipientEmail;

  const handleEmailCryptoPayment = async () => {
    if (!smartAccount || !recipientWalletAddressOrEmail) {
      console.error("Informations incomplètes pour envoyer le NFT.");
      return;
    }

    try {
      const paymentTxHash = await performCryptoPayment({
        client,
        chain: polygon,
        priceInPol: priceInPol,
        minterAddress: minterAddress,
        account: smartAccount,
      });

      if (paymentTxHash) {
        await callBackEndTransferNFT({
          projectName,
          distributionType,
          buyerWalletAddress: smartAccount.address,
          recipientWalletAddressOrEmail,
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div>
      {/* Aperçu de l'image */}
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

      {/* Nombre de NFTs vendus */}
      <div className="text-gray-500 mt-2 flex justify-center">
        Offered {soldCount} times
      </div>

      {/* Connexion */}
      <div className="text-center mt-5">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

      {/* Achat */}
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

