"use client";

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamic imports with ssr:false
const ThirdwebProvider = dynamic(() => import("thirdweb/react").then(mod => mod.ThirdwebProvider), {
  ssr: false
});

const ClientProviders = dynamic(() => import("@/components/providers/client-providers"), {
  ssr: false
});

export default function DynamicProviders({
  children
}: {
  children: ReactNode;
}) {
  return (
    <ThirdwebProvider>
      <ClientProviders>
        {children}
      </ClientProviders>
    </ThirdwebProvider>
  );
} 