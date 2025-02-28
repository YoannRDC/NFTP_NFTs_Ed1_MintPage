"use client";

import React, { useEffect, useState } from "react";
import { getActiveClaimCondition } from "thirdweb/extensions/erc721";
import { download } from "thirdweb/storage";
import { client, nftpNftsEd1Contract } from "../constants";
import { getContractMetadata } from "thirdweb/extensions/common";
import logger from "../utils/logger";

export default function ClaimSnapshot({ onSnapshotFetched }: { onSnapshotFetched: (snapshot: any) => void }) {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const metadata = await getContractMetadata({ contract: nftpNftsEd1Contract });
        const activeClaimCondition = await getActiveClaimCondition({ contract: nftpNftsEd1Contract });
        const fetchedSnapshot = await fetchSnapshot(activeClaimCondition.merkleRoot, metadata.merkle, client);

        // ✅ Fonction de conversion BigInt → String
        const replacer = (_key: any, value: { toString: () => any; }) => (typeof value === "bigint" ? value.toString() : value);

        // ✅ Affichage des données dans la console
        logger.info("Contract Metadata:", JSON.stringify(metadata, replacer, 2));
        logger.info("Active Claim Condition:", JSON.stringify(activeClaimCondition, replacer, 2));
        logger.info("Fetched Snapshot:", JSON.stringify(fetchedSnapshot, replacer, 2));

        setSnapshot(fetchedSnapshot);
        onSnapshotFetched(fetchedSnapshot); // ✅ Envoie le snapshot à ClaimConditionForm
      } catch (err) {
        console.error("Error fetching snapshot:", err);
        setError("Échec du chargement du snapshot.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [onSnapshotFetched]);

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 text-white">
      <h2 className="text-xl font-semibold">Claim Snapshot</h2>
      {loading ? (
        <p>Chargement...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div>
          <p className="text-green-400">Snapshot récupéré avec succès !</p>
          <pre className="text-sm overflow-auto max-h-80 p-2 bg-gray-800 rounded-lg">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

async function fetchSnapshot(merkleRoot: string, merkleMetadata: Record<string, string> | undefined, client: any) {
  if (!merkleMetadata) return null;

  try {
    const snapshotUri = merkleMetadata[merkleRoot];
    if (snapshotUri) {
      const raw = await download({ uri: snapshotUri, client }).then((r) => r.json());

      if (raw.isShardedMerkleTree && raw.merkleRoot === merkleRoot) {
        return download({ uri: raw.originalEntriesUri, client })
          .then((r) => r.json())
          .catch(() => null);
      }

      if (merkleRoot === raw.merkleRoot) {
        return raw.claims.map((claim: { address: string; maxClaimable: bigint; price: bigint; currencyAddress: string }) => ({
          address: claim.address,
          maxClaimable: claim.maxClaimable.toString(),
          price: claim.price.toString(),
          currencyAddress: claim.currencyAddress,
        }));
      }
    }
    return null;
  } catch (e) {
    console.error("Échec du chargement du snapshot", e);
    return null;
  }
}
