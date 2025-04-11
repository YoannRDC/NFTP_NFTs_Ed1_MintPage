// utils/nft.ts
import { readContract, ContractOptions } from "thirdweb";

export const getNFTBalance = async (
  contract: Readonly<ContractOptions<any, `0x${string}`>>,
  userAddress: string
): Promise<number | undefined> => {
  try {
    const data = await readContract({
      contract,
      method: "function balanceOf(address owner) view returns (uint256)",
      params: [userAddress],
    });
    // Si "data" est un BigNumber (par exemple, via ethers.js), vous pouvez utiliser data.toNumber()
    return Number(data);
  } catch (error) {
    console.error("Erreur lors de la récupération du solde NFT :", error);
    return undefined;
  }
};
