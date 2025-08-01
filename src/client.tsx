'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { scroll } from 'viem/chains';
import { defineChain } from 'viem';

// Custom Scroll chain with local proxy endpoint to avoid CORS
const customScrollChain = defineChain({
  ...scroll,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:3000/api/rpc'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:3000/api/rpc'],
    },
  },
});

const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PrivyProvider 
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
      "appearance": {
        "accentColor": "#A7C080",
        "theme": "#FFFFFF",
        "showWalletLoginFirst": false,
        "logo": "/SynthOS-icon+word.png",
        "walletChainType": "ethereum-only",
        "walletList": [
          "detected_ethereum_wallets",
          "metamask",
          "coinbase_wallet",
          "base_account",
          "rainbow",
          "wallet_connect"
        ]
      },
      "defaultChain": customScrollChain,
      "supportedChains": [customScrollChain],
      "loginMethods": [
        "email",
        "wallet",
        "google",
        "discord",
        "apple"
      ],
      "embeddedWallets": {
        "requireUserPasswordOnCreate": false,
        "showWalletUIs": true,
        "ethereum": {
          "createOnLogin": "users-without-wallets"
        },
      },
      "mfa": {
        "noPromptOnMfaRequired": false
      },
    }}
    >
      {children}
  </PrivyProvider>
  );
}

export default WalletProvider;