import { createThirdwebClient, toWei } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { SmartWalletOptions } from "thirdweb/wallets";
import { convertEurToPOL } from "./utils/conversion";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

if (!clientId) {
	throw new Error("No client ID provided");
}

export const client = createThirdwebClient({
	clientId: clientId,
});

// NFTP pubKey:
export const nftpPubKey = "0x7b471306691dee8FC1322775a997E1a6CA29Eee1";

// BackEnd Minter/Claimer
export const minterAddress = "0x6debf5C015f0Edd3050cc919A600Fb78281696B9"; 

export const accountAbstraction: SmartWalletOptions = {
	chain: polygon,
	sponsorGas: true,
};

// *******
// Artcards
// *******

// Artcards prices
const artCardEuroPrices = [120, 130, 140, 150, 160, 170, 180, 190, 200, 220, 5, 5, 300];
export function getArtcardEuroPrice(tokenId: number) {
  // Le modulo assure la répétition du cycle
  return artCardEuroPrices[tokenId % artCardEuroPrices.length];
}
export async function getArtcardPolPrice(tokenId: number) {
	const artcardEuroPrice = getArtcardEuroPrice(tokenId);
	return (await convertEurToPOL(artcardEuroPrice)).amount;
}