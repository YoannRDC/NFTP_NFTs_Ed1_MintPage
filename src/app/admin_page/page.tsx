"use client";
import React, { useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import ClaimSnapshot from "../components/ClaimSnapshot";
import ClaimConditionForm from "../components/ClaimConditionForm";
import { client, nftpPubKey } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import Link from "next/link";
import { defineChain, getContract } from "thirdweb";

// NFTP contracts
const nftpNftsEd1Address = "0x4d857dD092d3d7b6c0Ad1b5085f5ad3CA8A5C7C9";

// connect to your contract
const nftpNftsEd1Contract = getContract({
  client,
  chain: defineChain(137),
  address: nftpNftsEd1Address,
});

const AdminPage: React.FC = () => {
  const account = useActiveAccount();
  const [snapshotData, setSnapshotData] = useState<any[]>([]);
  const isAdmin = account?.address?.toLowerCase() === nftpPubKey.toLowerCase();

    const wallets = [
      inAppWallet({
        auth: { options: ["google", "email", "passkey", "phone"] },
      }),
      createWallet("io.metamask"),
      createWallet("com.coinbase.wallet"),
      createWallet("me.rainbow"),
      createWallet("io.rabby"),
      createWallet("io.zerion.wallet"),
    ];

  return (
    <div className="flex flex-col items-center">

      <div className="decorative-title">
        -- Admin Page --
      </div>

      <div className="m-10">
        <ConnectButton client={client} wallets={wallets} connectModal={{ size: "compact" }} locale="fr_FR"/>
      </div>

      {isAdmin && ( // ✅ Affiche uniquement si l'utilisateur est l'administrateur
        <>
          <ClaimSnapshot onSnapshotFetched={setSnapshotData} contract={nftpNftsEd1Contract} />
          <ClaimConditionForm initialOverrides={snapshotData} contract={nftpNftsEd1Contract} />
        </>
      )}

        <Link
            className="px-6 py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
            target="_blank"
            href="./"
        >
            Back to main page.
        </Link>
    </div>
  );
};

export default AdminPage;
