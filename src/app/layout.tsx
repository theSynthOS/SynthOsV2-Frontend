import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import DynamicProviders from "@/components/providers/dynamic-providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

export const metadata: Metadata = {
  title: "SynthOS",
  metadataBase: new URL("https://app.synthos.fun/"),
  description: "Invest with confidence using personalized crypto yield plans.",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SynthOS",
  },
  openGraph: {
    title: "SynthOS",
    description:
      "Invest with confidence using personalized crypto yield plans.",
    url: "https://app.synthos.fun",
    siteName: "SynthOS",
    images: [
      {
        url: "https://app.synthos.fun/og.jpg",
        width: 1200,
        height: 630,
        alt: "SynthOS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SynthOS",
    description:
      "Invest with confidence using personalized crypto yield plans.",
    images: ["https://app.synthos.fun/og.jpg"],
  },
};

// export const viewport = {
//   themeColor: "#0f0b22",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>SynthOS</title>
        <meta
          name="description"
          content="SynthOS - Invest with confidence using personalized crypto yield plans."
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* <link rel="apple-touch-icon" href="/icons/apple-icon-180x180.png" /> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <DynamicProviders>{children}</DynamicProviders>
      </body>
    </html>
  );
}
