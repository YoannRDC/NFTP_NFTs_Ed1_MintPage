import { useConnect, useActiveAccount } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";

export default function ConnectButtonFR({ client, accountAbstraction }: any) {
  const connect = useConnect();
  const account = useActiveAccount();

  // ✅ Liste des wallets disponibles
  const wallets = [
    inAppWallet({ auth: { options: ["google", "email", "passkey", "phone"] } }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
  ];

  return (
    <div className="flex flex-col items-center mb-20">
      {account ? (
        <p className="text-green-500">Connecté : {account.address}</p>
      ) : (
        <button
          onClick={() => connect.connect(wallets[0])} // ✅ Correction ici
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Connexion
        </button>
      )}
    </div>
  );
}
