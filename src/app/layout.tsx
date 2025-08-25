import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/client";
import ClientProviders from "@/components/providers/client-providers";
import { SmartWalletProvider } from "@/contexts/SmartWalletContext";
import { Toaster } from "@/components/toast-sonner";
import { DaimoProvider } from "@/components/providers/daimo-provider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const ttTravels = localFont({
  src: "../../public/font/TT_Travels_Next_Trial_Variable.ttf",
  variable: "--font-tt-travels",
  display: "swap",
  weight: "100 900", // Variable font weight range
});

export const metadata: Metadata = {
  title: "SynthOS",
  description:
    "SynthOS lets you invest in AI-powered personalized crypto yield plans",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
  ],
  metadataBase: new URL("https://app.synthos.fun"),
  openGraph: {
    title: "SynthOS",
    description:
      "SynthOS lets you invest in AI-powered personalized crypto yield plans",
    type: "website",
    url: "https://app.synthos.fun/",
    siteName: "SynthOS",
    locale: "en_US",
    images: [
      {
        url: "https://app.synthos.fun/og.jpg",
        width: 1200,
        height: 630,
        alt: "SynthOS - AI-powered personalized crypto yield plans",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SynthOS",
    description:
      "SynthOS lets you invest in AI-powered personalized crypto yield plans",
    images: [
      {
        url: "https://app.synthos.fun/og.jpg",
        alt: "SynthOS - AI-powered personalized crypto yield plans",
      },
    ],
    creator: "@synthos",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${ttTravels.variable} antialiased h-full`}
        suppressHydrationWarning
      >
        <WalletProvider>
          <SmartWalletProvider>
            <ClientProviders>
              <DaimoProvider>
                {children}
              </DaimoProvider>
              </ClientProviders>
          </SmartWalletProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
