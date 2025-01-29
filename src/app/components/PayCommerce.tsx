import { PayEmbed, getDefaultToken } from "thirdweb/react";
import { base, polygon } from "thirdweb/chains";
import { client, nftpPubKey } from "../constants";

const PayCommerce = () => {
  return (
    <PayEmbed
      client={client}
      theme={"light"}
      payOptions={{
        mode: "direct_payment",
        paymentInfo: {
          amount: "1",
          chain: polygon,
          token: getDefaultToken(polygon, "USDC"),
          sellerAddress: nftpPubKey,
        },
        metadata: {
          name: "Black Hoodie (Size L)",
          image: "/drip-hoodie.png",
        },
      }}
    />
  );
};

export default PayCommerce;
