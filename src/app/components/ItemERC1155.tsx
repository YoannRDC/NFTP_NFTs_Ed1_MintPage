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
  projectMappings,
  StripeMode,
} from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { readContract } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc1155";
import StripePurchasePage from "./StripePurchasePage";

interface ItemERC721Props {
  priceInCrypto: number | string | null;
  priceInEur: number | string | null;
  contract: any;
  stripeMode: StripeMode;
  previewImage: string;
  redirectPage: string;
  distributionType: DistributionType;
  tokenId: bigint;
  projectName: string;
  showSupply: boolean;
  offererName: string;
  chain: string;
}

export default function ItemERC1155({
  priceInCrypto,
  priceInEur,
  contract,
  stripeMode,
  previewImage,
  redirectPage,
  distributionType,
  tokenId,
  projectName,
  showSupply,
  offererName,
  chain
}: ItemERC721Props) {
  const smartAccount = useActiveAccount();
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [soldCount, setSoldCount] = useState<number>(0);										
  const [requestedQuantity, setrequestedQuantity] = useState<bigint>(1n);																	  
  const minterAddress = getProjectMinterAddress(projectName);
													   
  const totalPricePol =
    (priceInCrypto !== null && priceInCrypto !== undefined
      ? typeof priceInCrypto === "number"
        ? priceInCrypto
        : parseFloat(priceInCrypto)
      : 0) * Number(requestedQuantity);

  const totalPriceEur =
    (priceInEur !== null && priceInEur !== undefined
      ? typeof priceInEur === "number"
        ? priceInEur
        : parseFloat(priceInEur)
      : 0) * Number(requestedQuantity);

															  
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

																								   
  useEffect(() => {
    const fetchSupplyAndSold = async () => {
      try {
														  
        const totalMinted = await readContract({
          contract: contract,
          method: "function totalSupply(uint256 tokenId) view returns (uint256)",
          params: [tokenId],
        });
        const total = Number(totalMinted);
        setTotalSupply(total);

																															
        const sellerBalance = await readContract({
          contract: contract,
          method: "function balanceOf(address account, uint256 id) view returns (uint256)",
          params: [minterAddress, tokenId],
        });
        const sellerBal = Number(sellerBalance);

																										  
        const sold = total - sellerBal;
        setSoldCount(sold);
      } catch (error) {
        console.error("Erreur lors de la récupération des infos de supply :", error);
      }
    };

    fetchSupplyAndSold();
  }, [contract, tokenId, minterAddress]);

												
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setrequestedQuantity(BigInt(e.target.value));
  };

																  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="border p-4 rounded-lg shadow-lg text-center">
      {/* Aperçu optimisé du NFT */}
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

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={toggleModal} // Cliquer n'importe où dehors ferme
        >
          <div className="relative w-screen h-screen">
            {/* Bouton Télécharger */}
            <a
              href={previewImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded shadow hover:bg-gray-200 z-50"
              onClick={(e) => e.stopPropagation()} // empêcher fermeture juste si on clique sur le bouton
            >
              Télécharger l’image en haute définition
            </a>

            {/* Image */}
            <Image
              src={previewImage}
              alt="NFT agrandi"
              fill
              sizes="100vw"
              style={{ objectFit: "contain", cursor: "pointer" }}
              className="rounded-none"
              onClick={toggleModal} // Clic sur l'image ferme la modal
            />
            <div className="absolute top-2 right-4 bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded">
              {tokenId.toString()}
            </div>
          </div>
        </div>
      )}

      
      <div className="text-gray-500 mt-2 flex justify-center">
        {showSupply === false ? (
          <>{soldCount} NFT vendu</>
        ) : (
          <>{soldCount}/{totalSupply} NFT vendu</>
        )}
      </div>

      <div className="text-center mt-5">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          locale="fr_FR"
        />
      </div>

								  
      <div className="flex flex-col m-2">
        {smartAccount ? (
          <div className="text-center">
																  
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
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <TransactionButton
              transaction={() =>
                claimTo({
                  contract: contract,
                  to: smartAccount.address,
                  tokenId: tokenId,
                  quantity: BigInt(requestedQuantity),
                })
              }
              onError={(error: Error) => {
                console.error(error);
                const errorMessage = encodeURIComponent(error.message);
                window.location.href = `${redirectPage}?paymentResult=error&errorMessage=${errorMessage}`;
              }}
              onTransactionConfirmed={() => {
                window.location.href = `${redirectPage}?paymentResult=success`;
              }}
            >
              Acheter en Crypto
            </TransactionButton>

            <p className="mb-2">
              {totalPricePol} {projectMappings[projectName as keyof typeof projectMappings].blockchain.nativeSymbol}
            </p>

            <StripePurchasePage
              projectName={projectName}
              contract={contract}
              distributionType={distributionType}
              buyerWalletAddress={smartAccount?.address || ""}
              recipientWalletAddressOrEmail={smartAccount?.address || ""}
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
