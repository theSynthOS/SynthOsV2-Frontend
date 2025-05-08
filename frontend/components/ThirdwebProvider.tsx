'use client';

import { ThirdwebProvider as ThirdwebProviderBase } from "thirdweb/react";
import { client } from "../lib/thirdweb";
import { wallets } from "./WalletProvider";

export function ThirdwebProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProviderBase
      client={client}
      wallets={wallets}
    >
      {children}
    </ThirdwebProviderBase>
  );
} 