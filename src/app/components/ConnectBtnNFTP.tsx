import { polygon } from "thirdweb/chains";
import { ConnectButton } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from "../constants";

// ************
// Construit avec: 
// https://playground.thirdweb.com/connect/sign-in/button?tab=code
//************* */

export default function ConnectBtnNFTP() {

  const wallets = [
    inAppWallet({
      auth: {
        options: ["google", "email", "passkey", "phone"],
      },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
  ];

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      connectModal={{ size: "compact" }}
      accountAbstraction={{
        chain: polygon,
        sponsorGas: true,
      }}
    />
  );
}
