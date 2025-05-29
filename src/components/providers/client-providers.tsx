"use client";

import dynamic from "next/dynamic";
import { ReactNode, useState, useEffect } from "react";
import PullToRefresh from "@/components/features/pull-to-refresh";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { useActiveAccount } from "thirdweb/react";
import { useAuth } from "@/contexts/AuthContext";
import { PointsProvider } from "@/contexts/PointsContext";
import Header from "@/components/features/header";
import Navbar from "@/components/features/navigation";

// Lazy load components that aren't needed immediately
const AuthProvider = dynamic(
  () => import("@/contexts/AuthContext").then((mod) => mod.AuthProvider),
  {
    ssr: false,
  }
);

interface ClientProvidersProps {
  children: ReactNode;
}

// Separate component to handle account syncing after AuthProvider is mounted
function AccountSyncWrapper({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const { isAuthenticated, address, syncWallet } = useAuth();

  // Monitor active account and sync with AuthContext when it changes
  useEffect(() => {
    if (account?.address) {
      // If authenticated and account address is different from auth address,
      // sync the wallet address in the auth context
      if (isAuthenticated && address && account.address !== address) {
        syncWallet(account.address);
      }

      // Store the account in localStorage for persistence
      const existingAuth = localStorage.getItem("user_auth");
      if (!existingAuth) {
        const newAuth = {
          address: account.address,
        };
        localStorage.setItem("user_auth", JSON.stringify(newAuth));
      } else {
        try {
          const authData = JSON.parse(existingAuth);
          if (authData.address !== account.address) {
            authData.address = account.address;
            localStorage.setItem("user_auth", JSON.stringify(authData));
          }
        } catch (e) {
          console.error("Error updating localStorage with account address:", e);
        }
      }
    }
  }, [account, isAuthenticated, address, syncWallet]);

  return <>{children}</>;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Check if current page is the landing page
  const isLandingPage = pathname === "/";

  // Handle refresh action for global pull-to-refresh
  const handleGlobalRefresh = async () => {

    // Simulate API call or data refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Refresh the current page
    router.refresh();
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <PointsProvider>
          {/* Only show header on non-landing pages */}
          {!isLandingPage && (
            <div className="fixed top-0 left-0 right-0 bg-[#0f0b22] z-50">
              <Header />
            </div>
          )}

          <PullToRefresh onRefresh={handleGlobalRefresh}>
            <AccountSyncWrapper>{children}</AccountSyncWrapper>
          </PullToRefresh>

          {/* Only show navbar on non-landing pages */}
          {!isLandingPage && (
            <div className="fixed bottom-0 left-0 right-0">
              <Navbar />
            </div>
          )}
        </PointsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
