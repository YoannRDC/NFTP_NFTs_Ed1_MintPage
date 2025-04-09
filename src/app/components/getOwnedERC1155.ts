import {
	ADDRESS_ZERO,
	type NFT,
	type BaseTransactionOptions,
	// Le type Hex peut être utile dans certains cas
	type Hex,
} from "thirdweb";
import { getOwnedTokenIds, isERC1155 } from "thirdweb/extensions/erc1155";

export type GetERC1155Params = {
	/** L'adresse du wallet dont on veut récupérer les tokens ERC1155 */
	address: string;
	/** TokenId de départ (optionnel – utilisé pour le fallback) */
	start?: number;
	/** Nombre de tokenIds à scanner (optionnel – utilisé pour le fallback) */
	count?: number;
	/** (Optionnel) Limite le nombre de requêtes par seconde */
	requestPerSec?: number;
};

export async function getOwnedERC1155(
	options: BaseTransactionOptions<GetERC1155Params>,
): Promise<NFT[]> {
	const { contract, requestPerSec, address, start, count } = options;

	// Vérifie que le contrat fourni implémente bien ERC1155
	const is1155 = await isERC1155({ contract });
	if (!is1155) {
		throw new Error("Le contrat n'est pas un contrat ERC1155.");
	}

	// On tente de récupérer via RPC les tokenIds et le solde pour chacun
	let ownedTokenBalances: { tokenId: bigint; balance: bigint }[] | null = null;
	try {
		ownedTokenBalances = await getOwnedTokenIds({
			contract,
			start,
			count,
			address,
		});
	} catch (error) {
		ownedTokenBalances = null;
	}

	// Si la récupération RPC a fonctionné et renvoie des tokens
	if (ownedTokenBalances !== null) {
		if (!ownedTokenBalances.length) {
			return [];
		}
		// On récupère les métadonnées pour chaque token via getNFT.
		// La fonction getNFT attend un tokenId de type bigint, 
		// c'est pourquoi on extrait la propriété tokenId de chaque objet.
		const { getNFT } = await import("thirdweb/extensions/erc1155");
		return Promise.all(
			ownedTokenBalances.map(({ tokenId, balance }) =>
				getNFT({
					contract,
					tokenId,
				}).then((nft) => ({
					...nft,
					owner: address,
					// Si vous souhaitez conserver l'info du solde,
					// vous pouvez l'ajouter en propriété supplémentaire.
					balance,
				})),
			),
		);
	}

	// --- Mode Fallback ---
	// Dans ce cas, la méthode RPC n'a pas été disponible.
	// Pour ce fallback, il faut impérativement fournir 'start' et 'count'.
	if (start === undefined || count === undefined) {
		throw new Error(
			"Le fallback nécessite les paramètres 'start' et 'count' pour définir la plage à scanner.",
		);
	}

	// On définit la liste des tokenIds sur la base des paramètres start et count.
	const tokenIds = Array.from({ length: count }, (_, i) => BigInt(start + i));

	// On importe les fonctions nécessaires pour le fallback
	const { balanceOf, getNFT } = await import("thirdweb/extensions/erc1155");

	let tokensWithBalance: { tokenId: bigint; balance: bigint }[] = [];

	if (requestPerSec) {
		// Découpe la liste en chunks afin de respecter la limite de requêtes par seconde.
		const chunks: bigint[][] = [];
		for (let i = 0; i < tokenIds.length; i += requestPerSec) {
			chunks.push(tokenIds.slice(i, i + requestPerSec));
		}
		for (const chunk of chunks) {
			const balances = await Promise.all(
				chunk.map((tokenId) =>
					balanceOf({ contract, tokenId, owner: address }).catch(() => 0),
				),
			);
			balances.forEach((bal, idx) => {
				if (BigInt(bal) > 0n) {
					tokensWithBalance.push({ tokenId: chunk[idx], balance: BigInt(bal) });
				}
			});
		}
	} else {
		// Sans limitation, on récupère les soldes pour tous les tokens de la plage.
		const balances = await Promise.all(
			tokenIds.map((tokenId) =>
				balanceOf({ contract, tokenId, owner: address }).catch(() => 0),
			),
		);
		tokensWithBalance = tokenIds
			.map((tokenId, idx) => ({ tokenId, balance: BigInt(balances[idx]) }))
			.filter(({ balance }) => balance > 0n);
	}

	return Promise.all(
		tokensWithBalance.map(({ tokenId, balance }) =>
			getNFT({ contract, tokenId }).then((nft) => ({
				...nft,
				owner: address,
				balance,
			})),
		),
	);
}
