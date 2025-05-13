import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { ConnectButton } from "thirdweb/react";

import { inAppWallet, createWallet, SmartWalletOptions } from "thirdweb/wallets";
import { client } from "../constants";

const wallets = [
  inAppWallet({
    auth: {
      options: ["email"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("io.zerion.wallet"),
  createWallet("com.trustwallet.app"),
];

const accountAbstraction: SmartWalletOptions = {
	chain: polygon,
	sponsorGas: true,
};

export function ConnectButtonSimpleWithAccAbstraction() {
  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      accountAbstraction={accountAbstraction}
      connectModal={{
        size: "compact",
        titleIcon: "https://www.authentart.com/AuthenArt_Logo_v2.png",
        showThirdwebBranding: false,
      }}
      locale={"fr_FR"}
    />
  );
}
