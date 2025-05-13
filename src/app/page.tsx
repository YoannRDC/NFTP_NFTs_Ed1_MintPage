"use client";

import Image from "next/image";
import { useActiveAccount } from "thirdweb/react";
import Link from "next/link";
import authenArt_Logo from "@public/AuthenArt_Logo_v2.png";
import youtube_logo from "@public/youtube_logo.png";
import MenuItem from "./components/MenuItem";
import { nftpPubKey } from "./constants";
import { ConnectButtonSimple } from "./components/ConnectButtonSimple";

export default function Home() {
  const account = useActiveAccount();
  const isAdmin: boolean =
    account?.address?.toLowerCase() === nftpPubKey.toLowerCase();

  return (
    <div className="py-20">
      <Header />
      <div className="flex justify-center">
        <ConnectButtonSimple />
      </div>
      <br />
      <p className="text-center text-sm text-gray-400 mb-10">
        <Link
          className="text-sm text-gray-400"
          target="_blank"
          href="https://www.youtube.com/@NFTPropulsion/shorts"
        >
          <span className="underline">Besoin d’aide ?</span>{" "}
          <Image
            src={youtube_logo}
            alt="Logo Youtube"
            width={20}
            style={{
              filter: "drop-shadow(0px 0px 30px rgba(255, 255, 255, 0.66))",
              display: "inline",
              verticalAlign: "middle",
              marginLeft: "5px",
            }}
          />
        </Link>
      </p>

      {/* Passage de isAdmin au composant Menu */}
      <Menu isAdmin={isAdmin} />
      <Footer />

      {isAdmin && (
        <div className="flex justify-center my-6">
          <Link
            className="px-6 py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
            target="_blank"
            href="./admin_page"
          >
            🚀 Go to Admin Page
          </Link>
        </div>
      )}
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

type MenuProps = {
  isAdmin: boolean;
};

function Menu({ isAdmin }: MenuProps) {
  return (
    <div>
      <div className="flex justify-center mb-20">
        <Image
          src="/Les_Collections_v4.png"
          alt="Les Collections"
          width={500}
          min-width={500}
          height={500} // Hauteur pour éviter les erreurs de Next.js
          className="w-1/2 drop-shadow-lg" // Largeur à 50% avec une ombre légère
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
          imageSrc="/nftp_ed1/logo_seul_11.png"
        />
        <MenuItem
          title="Nature & Gîtes - Edition originale"
          href="/nature_et_gites"
          description="Les NFTs de Nature & Gîtes."
          imageSrc="/nature_et_gites/Nature_et_Gites.jpg"
        />
        <MenuItem
          title="Art Cards"
          href="/artcards"
          description="52 œuvres uniques qui entrelacent les quatre symboles d'un jeu de 52 cartes."
          imageSrc="/artcards/ArtCards.gif"
        />
        <MenuItem
          title="CadenART"
          href="/cadenart"
          description="Passionné de nature, Loïc Radenac saisis des instants simples lors de ses randonnées."
          imageSrc="/cadenart/cadenart.jpg"
        />
        <MenuItem
          title="Happy Birthday Cakes"
          href="/happy_birthday_cakes"
          description="🎂 Offrez un gâteau d’anniversaire en NFT !"
          imageSrc="/happy_birthday_cakes/preview.gif"
        />
        {isAdmin && (
          <MenuItem
            title="Nicole Mathieu"
            href="/nicole_mathieu_ed1"
            description="First NFT collection of Nicole Mathieu."
            imageSrc="/nicole_mathieu_ed1/Nicole_Mathieu.png"
          />
        )}
      </div>
    </div>
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
        By NFTpropulsion.fr
      </Link>
    </div>
  );
}
