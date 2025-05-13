"use client";

import dynamic from 'next/dynamic';

// Lazy load heavy components with loading states
const ProtocolSpotlight = dynamic(() => import("@/components/features/protocol-spotlight"), {
  loading: () => <div className="h-32 bg-gray-800/50 rounded-lg animate-pulse" />,
  ssr: false
});

const TopYielders = dynamic(() => import("@/components/features/top-yielders"), {
  loading: () => <div className="h-32 bg-gray-800/50 rounded-lg animate-pulse" />,
  ssr: false
});

const TrendingProtocols = dynamic(() => import("@/components/features/trending-protocols"), {
  loading: () => <div className="h-32 bg-gray-800/50 rounded-lg animate-pulse" />,
  ssr: false
});

const PWAInstaller = dynamic(() => import("@/components/features/pwa-installer"), {
  loading: () => null,
  ssr: false
});

export default function DynamicFeatures() {
  return (
    <>
      {/* Spotlight */}
      <ProtocolSpotlight />

      {/* Top Yielders */}
      <TopYielders />

      {/* Trending */}
      <TrendingProtocols />

      {/* PWA Installer */}
      <PWAInstaller />
    </>
  );
} 