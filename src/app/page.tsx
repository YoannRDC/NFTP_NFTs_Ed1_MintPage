import Image from "next/image";
import { ConnectButton } from "thirdweb/react";
import thirdwebIcon from "@public/thirdweb.svg";
import bannerImage from "@public/Banner.png";
import nftpLogoImage from "@public/Logo_20ko.png";
import { accountAbstraction, client } from "./constants";
import Link from "next/link";

export default function Home() {
	return (
		<div className="py-20">
			<Header />
			<div className="flex justify-center mb-20">
				<br/>
				<ConnectButton
					client={client}
					accountAbstraction={accountAbstraction}
				/>
			</div>
			<Menu />
			<Footer />
		</div>
	);
}

function Header() {
	return (
		<header className="flex flex-col items-center mb-20 md:mb-20 w-full relative">
			{/* ✅ BANNIÈRE PLEINE LARGEUR */}
			<div className="absolute top-0 left-0 w-screen h-[250px] md:h-[400px] overflow-hidden">
				<Image
					src={bannerImage}
					alt="AutentART Banner"
					fill // ✅ Remplit l’espace disponible (remplace layout="fill")
					className="object-cover w-full h-full"
					priority
				/>
			</div>

Test 1
			{/* ✅ Logo et texte en overlay */}
			<Image
				src={nftpLogoImage}
				alt="NFTpropulsion logo"
				width={120}
				style={{
					filter: "drop-shadow(0px 0px 24px #a726a9a8)",
				}}
			/>
			<h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-6 text-zinc-100">
				AutentART
			</h1>
			<p className="text-zinc-300 text-base">
				True French Art With Real Artists !
			</p>
		</header>
	);
}

function Menu() {
	return (
		<div className="grid gap-4 lg:grid-cols-3 justify-center">
			<MenuItem
				title="NFT Propulsion Edition 1"
				href="/nftp_ed1"
				description="First NFT collection of NFT Propulsion."
			/>
			<MenuItem
				title="Nicole Mathieu"
				href="/nicole_mathieu_ed1"
				description="First NFT collection of Nicole Mathieu."
			/>
		</div>
	);
}

function MenuItem(props: { title: string; href: string; description: string }) {
	return (
		<Link
			href={props.href}
			className="flex flex-col border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 transition-colors hover:border-zinc-700"
		>
			<article>
				<h2 className="text-lg font-semibold mb-2">{props.title}</h2>
				<p className="text-sm text-zinc-400">{props.description}</p>
			</article>
		</Link>
	);
}

function Footer() {
	return (
		<div className="flex flex-col items-center mt-20">
			<Link
				className="text-center text-sm text-gray-400"
				target="_blank"
				href="https://nftpropulsion.fr"
			>
				Visit NFTpropulsion.fr
			</Link>
		</div>
	);
}
