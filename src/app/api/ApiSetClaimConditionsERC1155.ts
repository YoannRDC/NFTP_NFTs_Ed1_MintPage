import { createThirdwebClient, defineChain, getContract, sendTransaction } from "thirdweb";
import { setClaimConditions } from "thirdweb/extensions/erc1155";
import { privateKeyToAccount } from "thirdweb/wallets";

export async function setClaimConditionERC1155({
    tokenId,
    contractAddress,
    privateKey,
    thirdwebSecretKey,
    chainId,
    maxClaimableSupply,
    maxClaimablePerWallet,
    currency,
    price,
    startDate,
    metadata,
    overrideList,
  }: {
    tokenId: number;
    contractAddress: string;
    privateKey: string;
    thirdwebSecretKey: string;
    chainId?: string;
    maxClaimableSupply: string;
    maxClaimablePerWallet: string;
    currency: string;
    price: string;
    startDate: string;
    metadata: string;
    overrideList: Array<{
      address: string;
      maxClaimable: string;
      price: string;
    }>;
  }) {
    const client = createThirdwebClient({ secretKey: thirdwebSecretKey });
    const chain = defineChain(Number(chainId));
    const nftContract = getContract({ client, chain, address: contractAddress });
  
    const account = privateKeyToAccount({ client, privateKey });
    console.log("Adresse dérivée de la clé privée :", account.address);
  
    const tokenIdBig = BigInt(tokenId);
    const transaction = setClaimConditions({
      contract: nftContract,
      tokenId: tokenIdBig,
      phases: [
        {
          maxClaimableSupply: BigInt(maxClaimableSupply),
          maxClaimablePerWallet: BigInt(maxClaimablePerWallet),
          currencyAddress: currency,
          price: parseFloat(price),
          startTime: new Date(startDate),
          overrideList,
          metadata,
        },
      ],
    });
  
    const txResult = await sendTransaction({
      transaction,
      account,
    });
  
    return txResult;
  }