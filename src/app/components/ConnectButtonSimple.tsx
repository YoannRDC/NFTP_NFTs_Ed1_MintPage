import { createThirdwebClient } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";

const client = createThirdwebClient({
  clientId: "....",
});

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

export function ConnectButtonSimple() {
  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      connectModal={{
        size: "compact",
        titleIcon: "https://www.authentart.com/AuthenArt_Logo_v2.png",
        showThirdwebBranding: false,
      }}
      locale={"fr_FR"}
    />
  );
}
