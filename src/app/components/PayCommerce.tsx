import { PayEmbed, getDefaultToken } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { client } from "../constants";

const PayCommerce = () => {
  return (
    <PayEmbed
      client={client}
      theme={"light"}
      payOptions={{
        mode: "direct_payment",
        paymentInfo: {
          amount: "35",
          chain: base,
          token: getDefaultToken(base, "USDC"),
          sellerAddress: "0x7b471306691dee8FC1322775a997E1a6CA29Eee1",
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
