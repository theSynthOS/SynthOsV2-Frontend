import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext"
import { ThirdwebProvider } from "thirdweb/react";
import { client, scrollSepolia } from "@/client";
import Navbar from "@/components/features/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SynthOS V2",
  description: "SynthOS V2 - Your gateway to the future of DeFi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SynthOS",
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
        <link rel="apple-touch-icon" href="/SynthOS-tranparent.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThirdwebProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
                {children}
              <div className="fixed bottom-0 left-0 right-0 z-10">
                <Navbar />
              </div>
            </div>
          </AuthProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
