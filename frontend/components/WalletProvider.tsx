'use client';

import { inAppWallet } from "thirdweb/wallets";
import { scrollSepolia } from "../lib/thirdweb";

// Create the wallet configuration
const walletConfig = {
  auth: {
    options: [
      "google" as const,
      "x" as const,
      "apple" as const,
      "discord" as const,
      "email" as const,
      "passkey" as const,
    ],
  },
  smartAccount: {
    chain: scrollSepolia,
    sponsorGas: false,
  },
};

// Export the wallets array
export const wallets = [inAppWallet(walletConfig)]; 