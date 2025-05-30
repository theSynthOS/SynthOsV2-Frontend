"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createWallet, inAppWallet, getUserEmail } from "thirdweb/wallets";
import { client, scrollSepolia } from "@/client";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";

// Session storage keys
const AUTH_STORAGE_KEY = "user_auth";
const SESSION_KEY = "session_active";
const PASSKEY_STORAGE_KEY = "hasPasskey";

type AuthData = {
  address: string;
  walletId?: string;
  walletType?: string;
  email?: string;
};

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  walletType?: string;
  email?: string;
  login: (
    address: string,
    walletId?: string,
    walletType?: string,
    preventRedirect?: boolean,
    email?: string
  ) => void;
  logout: () => void;
  syncWallet: (newAddress: string) => void;
  autoConnect: boolean;
  setAutoConnect: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [autoConnect, setAutoConnect] = useState(() => {
    // Check if auto-connect was previously enabled
    const stored = localStorage.getItem("autoConnect");
    return stored ? JSON.parse(stored) : true; // Default to true for better UX
  });
  const router = useRouter();
  const activeAccount = useActiveAccount();

  // Get address from auth data
  const address = authData?.address || null;

  // Smooth navigation helper
  const navigateTo = (path: string) => {
    // Add a small delay to allow state updates to complete
    // and animations to start before navigation
    setTimeout(() => {
      router.push(path);
    }, 50);
  };

  // Function to store auth data in localStorage
  const login = (
    address: string,
    walletId?: string,
    walletType?: string,
    preventRedirect?: boolean,
    email?: string
  ) => {
    const data: AuthData = { address, walletId, walletType, email };

    // Store in state
    setAuthData(data);
    setIsAuthenticated(true);

    // Store in localStorage for persistence across refreshes
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));

    // Set session active flag
    sessionStorage.setItem(SESSION_KEY, "true");

    // If autoConnect is enabled, store the wallet type for reconnection
    if (autoConnect) {
      localStorage.setItem("lastConnectedWallet", walletType || "");
    }

    // Store passkey info if applicable
    if (walletType === "passkey") {
      localStorage.setItem(PASSKEY_STORAGE_KEY, "true");
    }

    // Call the /api/points endpoint to upsert user in points DB
    if (email && address) {
      fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, address }),
      })
        .then((res) => res.json())
        .catch((err) => {
          console.error("/api/points error:", err);
        });
    }

    // Only redirect to home if not already there and if preventRedirect is not true
    if (!preventRedirect && window.location.pathname !== "/home") {
      router.push("/home");
    } else {
    }
  };

  // Function to sync with wallet changes without changing login status
  const syncWallet = (newAddress: string) => {
    if (!authData || !isAuthenticated) return;

    // Update auth data with new address but keep other properties
    const updatedData: AuthData = {
      ...authData,
      address: newAddress,
    };

    // Update state
    setAuthData(updatedData);

    // Update localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedData));
  };

  // Function to clear auth data
  const logout = () => {
    // Clear session flag first
    sessionStorage.removeItem(SESSION_KEY);

    // Clear state
    setAuthData(null);
    setIsAuthenticated(false);

    // Clear localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(PASSKEY_STORAGE_KEY);

    // Clear any other relevant storage
    try {
      // Try to clear ThirdWeb's connection data from localStorage
      // This helps ensure a clean disconnect
      const thirdwebKeys = Object.keys(localStorage).filter(
        (key) =>
          key.includes("thirdweb") ||
          key.includes("wallet") ||
          key.includes("account")
      );

      for (const key of thirdwebKeys) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error("Error clearing additional storage:", e);
    }
  };

  // Listen for wallet changes from ThirdWeb
  useEffect(() => {
    if (activeAccount && isAuthenticated && authData) {
      // If ThirdWeb account changes and different from current stored address
      if (activeAccount.address !== authData.address) {
        syncWallet(activeAccount.address);
      }
    }
  }, [activeAccount, isAuthenticated, authData]);

  // Update autoConnect setting
  const updateAutoConnect = (enabled: boolean) => {
    setAutoConnect(enabled);
    localStorage.setItem("autoConnect", JSON.stringify(enabled));
  };

  // Modify autoLogin to handle social auth reconnection
  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Only proceed with auto-login if autoConnect is enabled
        if (!autoConnect) {
          console.log("Auto-connect is disabled");
          return;
        }

        const hasActiveSession = sessionStorage.getItem(SESSION_KEY) === "true";
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        const lastConnectedWallet = localStorage.getItem("lastConnectedWallet");

        if (!storedAuth) return;

        const authData: AuthData = JSON.parse(storedAuth);
        const isOnHomePage = window.location.pathname === "/home";
        const shouldRedirect =
          window.location.pathname === "/" && hasActiveSession;

        // Handle social auth reconnection
        if (
          lastConnectedWallet &&
          ["google", "apple", "x"].includes(lastConnectedWallet)
        ) {
          try {
            const wallet = inAppWallet({
              auth: {
                options: [lastConnectedWallet as any],
                mode: "popup",
                redirectUrl: window.location.href,
              },
              smartAccount: {
                chain: scrollSepolia,
                sponsorGas: true,
              },
            });

            const account = await wallet.connect({
              client,
              strategy: lastConnectedWallet as any,
            });

            if (account) {
              const email = await getUserEmail({ client });
              setAuthData({ ...authData, email });
              setIsAuthenticated(true);
              sessionStorage.setItem(SESSION_KEY, "true");

              if (shouldRedirect && !isOnHomePage) {
                router.push("/home");
              }
              return;
            }
          } catch (e) {
            console.error("Social auth reconnection failed:", e);
          }
        }

        // Fallback to regular wallet reconnection
        if (authData.walletId) {
          try {
            const wallet = createWallet(authData.walletId as any);
            const account = await wallet.getAccount();

            if (account) {
              setAuthData(authData);
              setIsAuthenticated(true);
              sessionStorage.setItem(SESSION_KEY, "true");

              if (shouldRedirect && !isOnHomePage) {
                router.push("/home");
              }
            }
          } catch (e) {
            console.log("Regular wallet reconnection failed:", e);
            // Fall back to just using the stored address
            setAuthData(authData);
            setIsAuthenticated(true);
            sessionStorage.setItem(SESSION_KEY, "true");

            if (shouldRedirect && !isOnHomePage) {
              router.push("/home");
            }
          }
        } else if (authData.address) {
          setAuthData(authData);
          setIsAuthenticated(true);
          sessionStorage.setItem(SESSION_KEY, "true");

          if (shouldRedirect && !isOnHomePage) {
            router.push("/home");
          }
        }
      } catch (error) {
        console.error("Auto-login failed:", error);
        logout(); // Clear invalid auth data
      }
    };

    // Run autoLogin when component mounts and when autoConnect changes
    autoLogin();
  }, [router, autoConnect]); // Dependencies remain the same

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        address,
        walletType: authData?.walletType,
        email: authData?.email,
        login,
        logout,
        syncWallet,
        autoConnect,
        setAutoConnect: updateAutoConnect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
