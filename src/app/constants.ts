import { createThirdwebClient, defineChain, getContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { SmartWalletOptions } from "thirdweb/wallets";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

if (!clientId) {
	throw new Error("No client ID provided");
}

export const client = createThirdwebClient({
	clientId: clientId,
});

export const chain = polygon;

// Demo contracts
export const tokenDropAddress = "0xd64A548A82c190083707CBEFD26958E5e6551D18";
export const editionDropAddress = "0x638263e3eAa3917a53630e61B1fBa685308024fa";
export const editionDropTokenId = 0n;

export const editionDropContract = getContract({
	address: editionDropAddress,
	chain,
	client,
});

export const tokenDropContract = getContract({
	address: tokenDropAddress,
	chain,
	client,
});

// NFTP contracts
export const nftpNftsEd1Address = "0x4d857dD092d3d7b6c0Ad1b5085f5ad3CA8A5C7C9";

// NFTP pubKey:
export const nftpPubKey = "0x7b471306691dee8FC1322775a997E1a6CA29Eee1";

// connect to your contract
export const nftpNftsEd1Contract = getContract({
	client,
	chain: defineChain(137),
	address: nftpNftsEd1Address,
  });

export const accountAbstraction: SmartWalletOptions = {
	chain,
	sponsorGas: true,
};
