"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import {
  client,
  DistributionType,
  getProjectMinterAddress,
  NFTrecipient,
  projectMappings,
  StripeMode,
} from "../constants";
import { readContract } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc1155";
import StripePurchasePage from "./StripePurchasePage";
import { performCryptoPaymentAndStoreTxInBdd } from "../utils/cryptoOperation";
import { polygon } from "thirdweb/chains";
import { ConnectButtonSimple } from "./ConnectButtonSimple";

interface ItemERC1155_HBCProps {
  priceInCrypto: number;
  priceInEur: number;
  contract: any;
  stripeMode: StripeMode;
  previewImage: string;
  redirectPage: string;
  tokenId: bigint;
  projectName: string;
  blockchainId: number;
}

export default function ItemERC1155_HBC({
  priceInCrypto,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
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
  const [offererName, setOffererName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  const distributionType: DistributionType = selectedOption === NFTrecipient.Email
  ? DistributionType.EmailCode
  : DistributionType.ClaimToERC1155;


  const radioGroupName = `deliveryMethod-${tokenId.toString()}`;
  const minterAddress = getProjectMinterAddress(projectName);

  const totalPricePol = (priceInCrypto ?? 0) * Number(requestedQuantity);
  const totalPriceEur = (priceInEur ?? 0) * Number(requestedQuantity);
  const totalPriceEurCents = Math.round(totalPriceEur * 100);

  const recipientWalletAddressOrEmail = selectedOption === NFTrecipient.BuyerAddress
    ? smartAccount?.address
    : selectedOption === NFTrecipient.SpecificWallet
      ? specificWalletAddress
      : recipientEmail;

  let txResult;
  let paymentTxHash: string | null = null;

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

  const handleEmailCryptoPayment = async () => {
    // here recipientWalletAddressOrEmail contains email.
    if (!smartAccount || !recipientWalletAddressOrEmail) {
      console.error("Informations incomplètes pour envoyer le NFT.");
      return;
    }

    try {
      txResult = await performCryptoPaymentAndStoreTxInBdd({
        client,
        chain: polygon,
        priceInCrypto,
        minterAddress: minterAddress,
        account: smartAccount,
        email: recipientEmail || "", // TODO: Add from Mon compte.
        tokenId: tokenId.toString(),
        offererName,
      });

      paymentTxHash = txResult.hash;

      // TEMP redir
      // window.location.href = `${redirectPage}?paymentResult=success`;

    } catch (error: any) {
      // Si le hash n'a pas pu être récupéré du résultat, on le récupère du message d'erreur ou on garde null
      const fallbackHash = error?.transactionHash || error?.data?.hash || paymentTxHash || null;

      const baseErrorMessage = encodeURIComponent(error.message || "Transaction échouée");
      const hashParam = fallbackHash ? `&paymentTxHash=${fallbackHash}` : "";

      console.warn("Erreur capturée :", baseErrorMessage);
      console.warn("paymentTxHash trouvé :", fallbackHash);

      // TEMP redir
      //window.location.href = `${redirectPage}?paymentResult=error&errorMessage=${baseErrorMessage}${hashParam}`;
    }
    
  };
  

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div>
      {/* Image Preview */}
      <div className="flex justify-center mt-10">
        <div className="relative" onClick={toggleModal} style={{ cursor: "pointer" }}>
          <Image
            src={previewImage}
            alt="NFT preview"
            width={400}
            height={400}
            className="rounded-lg"
            style={{ height: "auto" }}
          />
          <div className="absolute top-2 right-4 bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded">
            {tokenId.toString()}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50" onClick={toggleModal}>
          <div className="relative w-screen h-screen">
            <a
              href={previewImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded shadow hover:bg-gray-200 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              Télécharger l’image HD
            </a>
            <Image
              src={previewImage}
              alt="NFT agrandi"
              fill
              sizes="100vw"
              style={{ objectFit: "contain", cursor: "pointer" }}
              className="rounded-none"
            />
          </div>
        </div>
      )}

      {/* Nombre vendus */}
      <div className="text-gray-500 mt-2 flex justify-center">
        Offered {soldCount} times
      </div>

      {/* Connect Button */}
      <div className="text-center mt-5">
        <ConnectButtonSimple />
      </div>

      {/* Purchase section */}
      <div className="flex flex-col mt-4">
        {smartAccount ? (
          <div className="text-center">
            {/* Delivery method */}
            <div className="my-4 text-left">
              {[
                { label: "Send to my wallet", value: NFTrecipient.BuyerAddress },
                { label: "Send to a specific wallet address", value: NFTrecipient.SpecificWallet },
                { label: "Send to an email", value: NFTrecipient.Email },
              ].map(({ label, value }) => (
                <div className="mb-2" key={value}>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={radioGroupName}
                      className="mr-2"
                      checked={selectedOption === value}
                      onChange={() => setSelectedOption(value)}
                    />
                    {label}
                  </label>
                  {selectedOption === value && value === NFTrecipient.SpecificWallet && (
                    <input
                      type="text"
                      placeholder="0x..."
                      value={specificWalletAddress}
                      onChange={(e) => setSpecificWalletAddress(e.target.value)}
                      className="border rounded px-2 py-1 text-black mt-2 w-full"
                    />
                  )}
                  {selectedOption === value && value === NFTrecipient.Email && (
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="border rounded px-2 py-1 text-black mt-2 w-full"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Offerer's name */}
            <div className="mb-4">
              <label>De la part de :</label>
              <input
                type="text"
                placeholder="Votre prénom"
                value={offererName}
                onChange={(e) => setOffererName(e.target.value)}
                className="border rounded px-2 py-1 text-black mt-2 w-full"
              />
            </div>

            {/* Crypto purchase button */}
            <div>
            {selectedOption === NFTrecipient.Email ? (
                <button
                  onClick={handleEmailCryptoPayment}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Acheter en Crypto
                  </button>
              ) : (
                <TransactionButton
                  transaction={async () => {
                    const toAddress = selectedOption === NFTrecipient.SpecificWallet
                      ? specificWalletAddress
                      : smartAccount.address!;
                    return claimTo({
                      contract,
                      to: toAddress,
                      tokenId,
                      quantity: requestedQuantity,
                    });
                  }}
                  onError={(error: Error) => {
                    console.error(error);
                    window.location.href = `${redirectPage}?paymentResult=error&errorMessage=${encodeURIComponent(error.message)}`;
                  }}
                  onTransactionConfirmed={() => {
                    window.location.href = `${redirectPage}?paymentResult=success`;
                  }}
                >
                  Acheter en Crypto
                </TransactionButton>
              )}
            </div>

            {/* Prices */}
            <p className="mb-2">
              {totalPricePol} {projectMappings[projectName as keyof typeof projectMappings].blockchain.nativeSymbol}
            </p>

            {/* Stripe */}
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
              offererName={offererName}
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
