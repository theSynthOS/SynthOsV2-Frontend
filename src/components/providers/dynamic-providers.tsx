"use client";

import { client, wallets } from '@/client';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { AutoConnect } from 'thirdweb/react';
import { scroll } from 'thirdweb/chains';

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
      <AutoConnect 
        client={client}
        wallets={wallets}
        chain={scroll}
        accountAbstraction={{
          chain: scroll,
          sponsorGas: true,
        }}
      />
      <ClientProviders>
        {children}
      </ClientProviders>
    </ThirdwebProvider>
  );
} 