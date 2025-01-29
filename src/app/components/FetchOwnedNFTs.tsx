import { useActiveAccount, useContractEvents  } from "thirdweb/react";
import { nftpNftsEd1Contract } from "../constants";
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode, Key } from "react";
import { tokensClaimedEvent } from "thirdweb/extensions/erc721";

export default function FetchOwnedNFTs() {
  const account = useActiveAccount();

  const { data: transferEvents, isLoading } = useContractEvents({
    contract: nftpNftsEd1Contract,
    events: [tokensClaimedEvent({ claimer: account?.address })],
  });

  // Extraire les ID de NFT possédés à partir des événements
  const ownedTokenIds = transferEvents?.flatMap((event) => {
    const { startTokenId, quantityClaimed } = event.args;
    return Array.from({ length: Number(quantityClaimed) }, (_, i) =>
      (BigInt(startTokenId) + BigInt(i)).toString()
    );
  }) || [];

  return (
    <div>
      <h2>Owned NFTs</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : ownedTokenIds.length > 0 ? (
        <ul>
          {ownedTokenIds.map((id: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined, index: Key | null | undefined) => (
            <li key={index}>NFT ID: {id}</li>
          ))}
        </ul>
      ) : (
        <p>No NFTs found.</p>
      )}
    </div>
  );
}
