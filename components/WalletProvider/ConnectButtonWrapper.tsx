'use client';

import { useEffect, useState } from "react";
import { ConnectButton } from "thirdweb/react";
import { client, scrollSepolia } from "../../lib/thirdweb";
import { isLoggedIn, login, generatePayload, logout } from "../../app/actions/login";

export function ConnectButtonWrapper() {
  const [isClient, setIsClient] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      setIsFirstTimeUser(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  if (!isClient) return null;

  return (
    <ConnectButton
      connectButton={{
        label: isFirstTimeUser ? "Create Account" : "Sign In",
      }}
      connectModal={{
        showThirdwebBranding: false,
        title: isFirstTimeUser ? "Welcome to SynthOS - Create Your Account" : "SynthOS - Sign In",
        titleIcon: "/logo.png",
        size: "compact",
        welcomeScreen: isFirstTimeUser ? {
          title: "Welcome to SynthOS",
          subtitle: "Let's create your account to get started with DeFi",
          img: {
            src: "/logo.png",
            width: 150,
            height: 150,
          },
        } : undefined,
      }}
      auth={{
        isLoggedIn: async (address: string) => await isLoggedIn(),
        doLogin: async (params: any) => { await login(params); },
        getLoginPayload: async ({ address }: { address: string }) =>
          generatePayload({ address, chainId: scrollSepolia.id }),
        doLogout: async () => { await logout(); },
      }}
      client={client}
      accountAbstraction={{
        chain: scrollSepolia,
        sponsorGas: true,
      }}
      appMetadata={{
        name: "SynthOS",
        description: "Scroll's #1 Verifiable DeFAI Agent Marketplace",
        url: "https://synthos.fun",
        logoUrl: "/logo.png",
      }}
      autoConnect={true}
      chain={scrollSepolia}
      onConnect={(wallet) => {
        if (isFirstTimeUser) {
          console.log("New user connected:", wallet);
        }
      }}
    />
  );
} 