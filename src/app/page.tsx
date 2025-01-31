import Image from "next/image";
import { ConnectButton } from "thirdweb/react";
import authenArt_Logo from "@public/AuthenArt_Logo_v2.png";
import bannerImage from "@public/Banner.png";
import nftpLogoImage from "@public/Logo_20ko.png";
import lesCollections from "@public/Les_Collections_v4.png";
import { accountAbstraction, client } from "./constants";
import Link from "next/link";

export default function Home() {
	return (
		<div className="py-20">
			{/* ✅ Supprimé le `py-20` qui limitait le header */}
			<Header />
			<div className="flex justify-center mb-20">
				<ConnectButton client={client} accountAbstraction={accountAbstraction} />
			</div>
			<Menu />
			<Footer />
		</div>
	);
}

function Header() {
	return (
		<header className="flex flex-col items-center mb-20 md:mb-20">
			<Image
				src={authenArt_Logo}
				alt="AutentART Logo"
				width={200}
				style={{
					filter: "drop-shadow(0px 0px 30px rgba(255, 255, 255, 0.66))",
				}}
			/>
		</header>
	);
}

function Menu() {
	return (
		<div>
			<div className="flex justify-center mb-5">
				<Image 
					src="/Les_Collections_v4.png"
					alt="Les Collections"
					width={500}
					min-width={500}
					height={500} // Ajout d'une hauteur pour éviter les erreurs de Next.js
					className="w-1/2 drop-shadow-lg" // Applique la largeur à 50% et une ombre légère
					style={{
						filter: "drop-shadow(0px 0px 30px rgba(255, 255, 255, 0.66))",
					}}
				/>
			</div>
			<div className="grid gap-4 lg:grid-cols-3 justify-center">
				<MenuItem
					title="NFT Propulsion Edition 1"
					href="/nftp_ed1"
					description="First NFT collection of NFT Propulsion."
					imageSrc="/logo_seul_11.png" // ✅ Ajout du `/` pour que Next.js le trouve dans `/public`
				/>
				<MenuItem
					title="Nicole Mathieu"
					href="/nicole_mathieu_ed1"
					description="First NFT collection of Nicole Mathieu."
					imageSrc="/Nicole_Mathieu.png"
				/>
			</div>
		</div>
	);
}


function MenuItem(props: { title: string; href: string; description: string; imageSrc: string }) {
	return (
		<Link href={props.href} className="flex flex-row items-center border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 transition-colors hover:border-zinc-700">
			{/* ✅ Image à gauche */}
			<div className="w-16 h-16 overflow-hidden rounded-lg mr-4">
				<img src={props.imageSrc} alt={props.title} className="object-cover w-full h-full" />
			</div>

			{/* ✅ Texte à droite */}
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
			<Link className="text-center text-sm text-gray-400" target="_blank" href="https://nftpropulsion.fr">
				By NFTpropulsion.fr
			</Link>
		</div>
	);
}
