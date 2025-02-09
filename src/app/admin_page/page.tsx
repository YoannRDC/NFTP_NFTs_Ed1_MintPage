"use client";
import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import ClaimSnapshot from "../components/ClaimSnapshot";
import ClaimConditionForm from "../components/ClaimConditionForm";

const AdminPage: React.FC = () => {
  const account = useActiveAccount();
  const [snapshotData, setSnapshotData] = useState<any[]>([]);

  const adminAddress = "0x7b471306691dee8FC1322775a997E1a6CA29Eee1"; // ✅ Adresse de l'administrateur
  const isAdmin = account?.address?.toLowerCase() === adminAddress.toLowerCase(); // ✅ Vérifie si l'utilisateur est l'administrateur

  return (
    <div className="flex flex-col items-center">

      <div className="decorative-title">
        -- Admin Page --
      </div>

      {isAdmin && ( // ✅ Affiche uniquement si l'utilisateur est l'administrateur
        <>
          <ClaimSnapshot onSnapshotFetched={setSnapshotData} />
          <ClaimConditionForm initialOverrides={snapshotData} />
        </>
      )}

    </div>
  );
};

export default AdminPage;
