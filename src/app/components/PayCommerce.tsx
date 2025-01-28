import { PayEmbed, getDefaultToken } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { client, nftpNftsEd1Address } from "../constants";

const PayCommerce = () => {
  return (
    <PayEmbed
      client={client}
      theme={"light"}
      payOptions={{
        mode: "direct_payment",
        paymentInfo: {
          amount: "1",
          chain: base,
          token: getDefaultToken(base, "USDC"),
          sellerAddress: nftpNftsEd1Address,
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
