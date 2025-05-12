import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext"
import { ThirdwebProvider } from "thirdweb/react";
import { client, scrollSepolia } from "@/client";
import { wallets } from "./WalletProvider";
import Navbar from "@/components/features/navigation"
import Header from "@/components/features/header"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeFi Protocol Tracker",
  description: "Track DeFi protocols and their APY/APR rates",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DeFi Tracker",
  },
};

export const viewport = {
  themeColor: "#0f0b22",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180x180.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="fixed top-0 left-0 right-0">
          <Header />
        </div>
        <ThirdwebProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThirdwebProvider>
        <div className="fixed bottom-0 left-0 right-0">
          <Navbar />
        </div>
      </body>
    </html>
  );
}
