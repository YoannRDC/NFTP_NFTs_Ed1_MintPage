import { createThirdwebClient } from "thirdweb";  
import { polygon } from "thirdweb/chains";
import { SmartWalletOptions } from "thirdweb/wallets";
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

export const accountAbstraction: SmartWalletOptions = {
	chain: polygon,
	sponsorGas: true,
};

// -----------------------------------------------------------------------------
// Mapping entre le nom du projet et ses clés
// -----------------------------------------------------------------------------
export const projectMappings: Record<string, { publicKey: string; privateKeyEnv: string; }> = {
	"ARTCARDS": {
		publicKey: "0x6debf5C015f0Edd3050cc919A600Fb78281696B9",
		privateKeyEnv: "PRIVATE_KEY_MINTER_ARTCARDS",
	},
	"NFTPED1": {
		publicKey: "0x6debf5C015f0Edd3050cc919A600Fb78281696B9", 
		privateKeyEnv: "PRIVATE_KEY_MINTER_ARTCARDS",
	},
	"NATETGITES": {
		publicKey: "0xD6F7CbF270e0e7DfceC0034ee3918e46f6727BD4", 
		privateKeyEnv: "PRIVATE_KEY_MINTER_NATETGITES",
	},
	"NMMATHIEU": {
		publicKey: "TBD", 
		privateKeyEnv: "TBD",
	},
	"HAPPYBIRTHDAYCAKES": {
		publicKey: "0x87e366F9F644c2dB43d9f24346C530F2915Be0d7", 
		privateKeyEnv: "PRIVATE_KEY_BIRTHDAY_CAKES",
	},
};

/**
 * Récupère la clé publique associée au projet.
 * @param projectName Nom du projet (ex: "ARTCARDS" ou "NATETGITES")
 * @returns La clé publique correspondant au projet.
 */
export function getProjectMinterAddress(projectName: string): string {
	const mapping = projectMappings[projectName.toUpperCase()];
	if (!mapping) {
		throw new Error(`Mapping non trouvé pour le projet: ${projectName}`);
	}
	return mapping.publicKey;
}

/**
 * Récupère le nom de la variable d'environnement contenant la clé privée associée au projet.
 * @param projectName Nom du projet (ex: "ARTCARDS" ou "NATETGITES")
 * @returns Le nom de la variable d'environnement pour la clé privée.
 */
export function getProjectMinterPrivateKeyEnvName(projectName: string): string {
	const mapping = projectMappings[projectName.toUpperCase()];
	if (!mapping) {
		throw new Error(`Mapping non trouvé pour le projet: ${projectName}`);
	}
	return mapping.privateKeyEnv;
}

// Fonction pour calculer le prix en euros en fonction du tokenId et du projet
export function getNFTEuroPrice( projectName: string, tokenId: string): number {
  const project = projectName.toUpperCase();
  
  if (project === "ARTCARDS") {
    // Politique de prix pour Artcards
	const artCardEuroPrices = [120, 130, 140, 150, 160, 170, 180, 190, 200, 220, 240, 260, 300];
    return artCardEuroPrices[Number(tokenId) % artCardEuroPrices.length];
  } else if (project === "NATETGITES") {
    // Les 500 premiers NFTs coûtent 50e, les 100 suivants coutent 30e.
	return Number(tokenId) < 500 ? 50 : 30;
  } else if (project === "NMMATHIEU") {
    // Tous les NFTs coutent 30e
    return 30;
  } else if (project === "HAPPYBIRTHDAYCAKES") {
    // Tous les NFTs coutent 10e
    return 10;
  } else {
    throw new Error(`Aucune politique de prix définie pour le projet: ${projectName}`);
  }
}

export async function getNFTPolPriceInWei(projectName: string, tokenId: string): Promise<bigint> {
	const artcardEuroPrice = getNFTEuroPrice(projectName, tokenId);
	const conversion = await convertEurToPOL(artcardEuroPrice);
	// conversion.amount est un nombre décimal, on le convertit en wei (BigInt) en multipliant par 1e18
	return BigInt(Math.floor(conversion.amount * 1e18));
  }
  
  export enum DistributionType {
	ClaimToERC721 = "claimToERC721",
	ClaimToERC1155 = "claimToERC1155",
	SafeTransferFromERC721 = "SafeTransferFromERC721"
  }

  export enum StripeMode {
	Live = "live",
	Test = "test",
  }