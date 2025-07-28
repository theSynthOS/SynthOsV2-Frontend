'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { scroll } from 'viem/chains';

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
      "defaultChain": scroll,
      "supportedChains": [scroll],
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