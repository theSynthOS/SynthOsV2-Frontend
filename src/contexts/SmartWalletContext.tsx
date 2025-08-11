"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";

interface SmartWalletContextType {
  smartWalletAddress: string | null;
  embeddedWalletAddress: string | null;
  displayAddress: string | null;
  isSmartWalletActive: boolean;
  smartWalletClient: any;
  isLoading: boolean;
  wallets: any;
}

const SmartWalletContext = createContext<SmartWalletContextType | undefined>(
  undefined
);

interface SmartWalletProviderProps {
  children: ReactNode;
}

export function SmartWalletProvider({ children }: SmartWalletProviderProps) {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();
  const [isLoading, setIsLoading] = useState(true);

  // Get smart wallet address from linkedAccounts, fallback to embedded wallet
  const smartAccount = user?.linkedAccounts?.find(
    (acc) => acc.type === "smart_wallet"
  );
  const smartWalletAddress = smartAccount?.address || null;
  const embeddedWalletAddress = user?.wallet?.address || null;
  // Fallback to any connected EOA wallet address from Privy wallets
  const eoaWalletAddress = Array.isArray(wallets)
    ? wallets.find((w: any) => w?.address)?.address || null
    : null;

  // Display address - prefer smart wallet, fallback to embedded
  const displayAddress =
    smartWalletAddress || embeddedWalletAddress || eoaWalletAddress;
  const isSmartWalletActive = !!smartWalletAddress;

  // Initialize smart wallet immediately after login
  useEffect(() => {
    setIsLoading(false);
  }, [authenticated, smartWalletClient, smartWalletAddress]);

  const value: SmartWalletContextType = {
    smartWalletAddress,
    embeddedWalletAddress,
    displayAddress,
    isSmartWalletActive,
    smartWalletClient,
    isLoading,
    wallets,
  };

  return (
    <SmartWalletContext.Provider value={value}>
      {children}
    </SmartWalletContext.Provider>
  );
}

export function useSmartWallet() {
  const context = useContext(SmartWalletContext);
  if (context === undefined) {
    throw new Error("useSmartWallet must be used within a SmartWalletProvider");
  }
  return context;
}
