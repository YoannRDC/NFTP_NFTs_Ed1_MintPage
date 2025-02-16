"use client";
import React, { useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import ClaimSnapshot from "../components/ClaimSnapshot";
import ClaimConditionForm from "../components/ClaimConditionForm";
import { client } from "../constants";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import Link from "next/link";

const AdminPage: React.FC = () => {
  const account = useActiveAccount();
  const [snapshotData, setSnapshotData] = useState<any[]>([]);

  const adminAddress = "0x7b471306691dee8FC1322775a997E1a6CA29Eee1"; // ✅ Adresse de l'administrateur
  const isAdmin = account?.address?.toLowerCase() === adminAddress.toLowerCase(); // ✅ Vérifie si l'utilisateur est l'administrateur

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
          <ClaimSnapshot onSnapshotFetched={setSnapshotData} />
          <ClaimConditionForm initialOverrides={snapshotData} />
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
