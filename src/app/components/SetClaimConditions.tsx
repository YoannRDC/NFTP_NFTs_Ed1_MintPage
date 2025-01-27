import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { nftpNftsEd1Contract } from "../constants";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const _conditions = [
    {
      startTimestamp: BigInt(Math.floor(Date.now() / 1000)), // Conversion en bigint
      maxClaimableSupply: BigInt(1000), // Maximum de 1000 NFTs
      supplyClaimed: BigInt(0), // Initialement 0
      quantityLimitPerWallet: BigInt(2), // Maximum de 2 NFTs par portefeuille
      merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // Merkle Root vide
      pricePerToken: BigInt(0), // Prix gratuit
      currency: "0x0000000000000000000000000000000000000000" as `0x${string}`, // ETH/MATIC natif
      metadata: "Mint gratuit pour tous", // Métadonnées
    },
  ];
  
  
  const _resetClaimEligibility = false;

  const onClick = () => {
    const transaction = prepareContractCall({
      contract: nftpNftsEd1Contract,
      method:
        "function setClaimConditions((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)",
      params: [_conditions, _resetClaimEligibility],
    });
    sendTransaction(transaction);
  };
}