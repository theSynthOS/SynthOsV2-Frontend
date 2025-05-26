import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import DynamicProviders from "@/components/providers/dynamic-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "SynthOS",
  description: "Invest with confidence using personalized yield plans.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DeFi Tracker",
  },
};

// export const viewport = {
//   themeColor: "#0f0b22",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>SynthOS</title>
        <meta name="description" content="SynthOS V2 - Your gateway to the future of DeFi" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* <link rel="apple-touch-icon" href="/icons/apple-icon-180x180.png" /> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DynamicProviders>
            {children}
        </DynamicProviders>
      </body>
    </html>
  );
}
