"use client";
import type React from "react";
//import { claimTo, getNFT, getOwnedNFTs } from "thirdweb/extensions/erc1155";
import {
	ConnectButton,
	MediaRenderer,
	TransactionButton,
	useActiveAccount,
	useReadContract,
} from "thirdweb/react";
import {
	accountAbstraction,
	client,
	nftpNftsEd1Contract,
	//editionDropContract,
	//editionDropTokenId,
} from "../constants";
import Link from "next/link";
import { claimTo, getOwnedNFTs } from "thirdweb/extensions/erc721";
import ConnectBtnNFTP from "../components/ConnectBtnNFTP";
import PayCommerce from "../components/PayCommerce";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import ClaimCondForm from "../components/ClaimCondForm";
import ClaimConditionComponent from "../components/ClaimCondition";
import FetchOwnedNFTs from "../components/FetchOwnedNFTs";
import TokenClaimed from "../components/TokenClaimed";

const GaslessHome: React.FC = () => {
	const smartAccount = useActiveAccount();

 	const { data: ownedNfts, isLoading: isNftLoading  } = useReadContract(getOwnedNFTs, {
		contract: nftpNftsEd1Contract,
		owner: smartAccount?.address ?? "",
	}); 
	console.log("ownedNfts :", ownedNfts);
	console.log("smartAccount?.address", smartAccount?.address ?? "No smart account connected");

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
		<div className="flex flex-col items-center">

			<h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-12 text-zinc-100">
				Sponsored Transactions YR Tests 6
			</h1>
 			<ConnectButton
				client={client}
				accountAbstraction={accountAbstraction}
				connectModal={{
					size: "compact",
				}}
			/> 
			<br/>
			<br/>
			-- Smart Wallet --
			<ConnectBtnNFTP />

			<br/>
			<br/>
			-- EOA Wallet --
			<ConnectButton
			client={client}
			wallets={wallets}
			connectModal={{ size: "compact" }}
			/>

			<br/>
			<br/>
			-- ClaimCondForm --
			<ClaimCondForm />

			<br/>
			<br/>
			-- FetchOwnedNFTs --
			<FetchOwnedNFTs />

			<br/>
			<br/>
			-- TokenClaimed --
			<TokenClaimed />

			<br/>
			<br/>
			-- ClaimConditionComponent --
			<ClaimConditionComponent/>

			<br/>
			<br/>
			-- Pay Commerce --
			<PayCommerce />

			<br/>
			<br/>
			<MediaRenderer
				client={client}
				src="/preview.gif"
				style={{ width: "50%", height: "auto", borderRadius: "10px" }}
			/>
			-- Add to Free Mint --

			<div className="flex flex-col">
				{isNftLoading ? (
					<div className="w-full mt-24">Loading...</div>
				) : (
					<>
					Bef ownedNfts nb.
						{ownedNfts && ownedNfts.length > 0 ? (

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								ownedNfts nb: {ownedNfts.length};
								{ownedNfts.map((nft, index) => (
									<div key={index} className="border p-4 rounded-lg shadow-lg text-center">
										<MediaRenderer
											client={client}
											src={nft.metadata.image}
											style={{ width: "100%", height: "auto", borderRadius: "10px" }}
										/>
										<p className="font-semibold mt-2">{nft.metadata.name || "NFT"}</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-center mt-4 text-gray-400">You don’t own any NFTs.</p>
						)}

						<br/>
						{smartAccount ? (
							<>
								<TransactionButton
									transaction={() =>
										claimTo({
											contract: nftpNftsEd1Contract,
											to: smartAccount.address,
											quantity: 1n,
										})
									}
									onError={(error) => {
										alert(`Error: ${error.message}`);
									}}
									onTransactionConfirmed={async () => {
										alert("Claim successful!");
									}}
								>
									Claim!
								</TransactionButton>
							</>
						) : (
							<p
								style={{
									textAlign: "center",
									width: "100%",
									marginTop: "10px",
								}}
							>
								Login to claim or buy an NFT (49 POL)
							</p>
						)}
						
					Aft ownedNfts nb.
					</>
				)}
			</div>


			<Link href={"/"} className="text-sm text-gray-400 mt-8">
				Back to menu
			</Link>
		</div>
	);
};

export default GaslessHome;
