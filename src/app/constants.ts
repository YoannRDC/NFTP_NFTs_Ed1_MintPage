import { createThirdwebClient } from "thirdweb";  
import { convertEurToPOL } from "./utils/conversion";

export const MAILCHIMP_LIST_ID="c642fe82cc";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;
if (!clientId) {
	throw new Error("No client ID provided");
}

export const client = createThirdwebClient({
	clientId: clientId,
});

// NFTP pubKey:
export const nftpPubKey = "0x7b471306691dee8FC1322775a997E1a6CA29Eee1";

export enum Blockchain {
	Polygon = "Polygon",
	Ethereum = "Ethereum",
	Amoy = "Amoy",
  }

export const BlockchainInfo: Record<Blockchain, { name: string; id: number }> = {
	[Blockchain.Polygon]: {
		name: "Polygon",
		id: 137,
	},
	[Blockchain.Ethereum]: {
		name: "Ethereum",
		id: 1, // ou undefined
	},
	[Blockchain.Amoy]: {
		name: "Amoy",
		id: 80002,
	},
};

// -----------------------------------------------------------------------------
// Mapping entre le nom du projet et ses clés
// -----------------------------------------------------------------------------
export const projectMappings = {
	ARTCARDS: {
	  projectName: "ARTCARDS",
	  contractAddress: "0x6DF0863afA7b9A81e6ec3AC89f2CD893d2812E47",
	  minterPublicKey: "0x6debf5C015f0Edd3050cc919A600Fb78281696B9",
	  minterPrivateKeyEnvVarName: "PRIVATE_KEY_MINTER_ARTCARDS",
	  blockchain: BlockchainInfo[Blockchain.Polygon],
	},
	NFTPED1: {
	  projectName: "NFTPED1",
	  contractAddress: "0x4d857dD092d3d7b6c0Ad1b5085f5ad3CA8A5C7C9",
	  minterPublicKey: "0x6debf5C015f0Edd3050cc919A600Fb78281696B9",
	  minterPrivateKeyEnvVarName: "PRIVATE_KEY_MINTER_ARTCARDS",
	  blockchain: BlockchainInfo[Blockchain.Polygon],
	},
	NATETGITES: {
	  projectName: "NATETGITES",
	  contractAddress: "0xA943ff4f15203efF9af71782c5AA9C2CcC899516",
	  minterPublicKey: "0xD6F7CbF270e0e7DfceC0034ee3918e46f6727BD4",
	  minterPrivateKeyEnvVarName: "PRIVATE_KEY_MINTER_NATETGITES",
	  blockchain: BlockchainInfo[Blockchain.Polygon],
	},
	NMMATHIEU: {
	  projectName: "NMMATHIEU",
	  contractAddress: "TBD",
	  minterPublicKey: "TBD",
	  minterPrivateKeyEnvVarName: "TBD",
	  blockchain: BlockchainInfo[Blockchain.Amoy],
	},
	HAPPYBIRTHDAYCAKES: {
	  projectName: "HAPPYBIRTHDAYCAKES",
	  contractAddress: "0xc58b841A353ab2b288d8C79AA1F3307F32f77cbf",
	  minterPublicKey: "0x87e366F9F644c2dB43d9f24346C530F2915Be0d7",
	  minterPrivateKeyEnvVarName: "PRIVATE_KEY_BIRTHDAY_CAKES",
	  blockchain: BlockchainInfo[Blockchain.Polygon],
	},
	CADENART: {
	  projectName: "CADENART",
	  contractAddress: "0x2d4108d38b19B8acC72B83B7Facb46dB0ECCe237",
	  minterPublicKey: "0x70fB670E902904f7BE7A7fd455c792f0B0C5Bccb",
	  minterPrivateKeyEnvVarName: "PRIVATE_KEY_CADENART",
	  blockchain: BlockchainInfo[Blockchain.Polygon],
	},
  } as const;

export type ProjectName = keyof typeof projectMappings;

  export function parseProjectName(projectNameRaw: string): ProjectName {
	const upper = projectNameRaw.toUpperCase() as ProjectName;
	if (!(upper in projectMappings)) {
		throw new Error(`Projet inconnu: ${projectNameRaw}`);
	}
	return upper;
}

export function getProjectMinterAddress(projectNameRaw: string): string {
	const projectName = parseProjectName(projectNameRaw); // sécurise le nom du projet
	const project = projectMappings[projectName];
	return project.minterPublicKey;
  }

  export function getProjectMinterPrivateKeyEnvName(projectNameRaw: string): string {
	const projectName = parseProjectName(projectNameRaw); // sécurise et vérifie le projet
	const project = projectMappings[projectName];
	return project.minterPrivateKeyEnvVarName;
  }
  

export function getNFTEuroPrice(projectName: ProjectName, tokenId: string): number {
	switch (projectName) {
		case projectMappings.ARTCARDS.projectName: {
			const artCardEuroPrices = [120, 130, 140, 150, 160, 170, 180, 190, 200, 220, 240, 260, 300];
			return artCardEuroPrices[Number(tokenId) % artCardEuroPrices.length];
		}
		case projectMappings.NATETGITES.projectName:
			return Number(tokenId) < 500 ? 50 : 30;
		case projectMappings.NMMATHIEU.projectName:
			return 30;
		case projectMappings.HAPPYBIRTHDAYCAKES.projectName:
			return 10;
		case projectMappings.CADENART.projectName:
			return 30;
		default:
			throw new Error(`Aucune politique de prix définie pour le projet: ${projectName}`);
	}
}

export async function getNFTPolPriceInWei(projectName: ProjectName, tokenId: string): Promise<bigint> {
	const artcardEuroPrice = getNFTEuroPrice(projectName, tokenId);
	const conversion = await convertEurToPOL(artcardEuroPrice);
	// conversion.amount est un nombre décimal, on le convertit en wei (BigInt) en multipliant par 1e18
	return BigInt(Math.floor(conversion.amount * 1e18));
  }
  
  export enum DistributionType {
	ClaimToERC721 = "claimToERC721",
	ClaimToERC1155 = "claimToERC1155",
	SafeTransferFromERC721 = "safeTransferFromERC721",
  	SafeTransferFromERC1155 = "safeTransferFromERC1155",
  	EmailCode = "emailCode",
  }

  export enum StripeMode {
	Live = "live",
	Test = "test",
  }

  export enum NFTrecipient {
	BuyerAddress= "buyerAddress",
	SpecificWallet= "specificWallet",
	Email= "email"
  }