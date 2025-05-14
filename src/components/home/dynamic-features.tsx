"use client";

import dynamic from 'next/dynamic';
import { useTheme } from "next-themes";

// Create a loading component that uses theme
const LoadingPlaceholder = () => {
  const { theme } = useTheme();
  return <div className={`h-32 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg animate-pulse`} />;
};

// Lazy load heavy components with loading states
const ProtocolSpotlight = dynamic(() => import("@/components/features/protocol-spotlight"), {
  loading: () => <LoadingPlaceholder />,
  ssr: false
});

const TopYielders = dynamic(() => import("@/components/features/top-yielders"), {
  loading: () => <LoadingPlaceholder />,
  ssr: false
});

const TrendingProtocols = dynamic(() => import("@/components/features/trending-protocols"), {
  loading: () => <LoadingPlaceholder />,
  ssr: false
});

const PWAInstaller = dynamic(() => import("@/components/features/pwa-installer"), {
  loading: () => null,
  ssr: false
});

export default function DynamicFeatures() {
  const { theme } = useTheme();
  
  return (
    <>
      {/* Spotlight */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <ProtocolSpotlight />
      </div>

      {/* Top Yielders */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <TopYielders />
      </div>

      {/* Trending */}
      <div className="mb-[80px]">
        <TrendingProtocols />
      </div>

      {/* PWA Installer */}
      <PWAInstaller />
    </>
  );
} 