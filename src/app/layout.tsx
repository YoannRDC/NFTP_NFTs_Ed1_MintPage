import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuthentArt.com",
  description: "Discover NFT collections created by genuine artists and support real-life projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
            src="https://cdn.cookie-script.com/s/47db04bac0d39f93c370091f61349c03.js"
            strategy="afterInteractive"
            type="text/javascript"
            charSet="UTF-8"
          />
        <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
          <ThirdwebProvider>{children}</ThirdwebProvider>
        </main>
        <footer className="bg-gray-100 text-sm text-gray-600 p-6 mt-auto border-t border-gray-300">
          <div className="max-w-screen-lg mx-auto">
            <p><a href="/mentions-legales" className="text-blue-600">Mentions légales</a></p>
            <p><a href="mailto:contact@nftpropulsion.fr" className="text-blue-500">contact@nftpropulsion.fr</a></p>
            <p>© {new Date().getFullYear()} NFT Propulsion – Tous droits réservés.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
