"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createWallet } from "thirdweb/wallets";
import { client } from "@/client";
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
    return stored ? JSON.parse(stored) : false;
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

  // Modify autoLogin to respect autoConnect setting
  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Only proceed with auto-login if autoConnect is enabled
        if (!autoConnect) {
    
          return;
        }

        // Rest of your existing autoLogin logic
        const hasActiveSession = sessionStorage.getItem(SESSION_KEY) === "true";

        // Get stored auth data
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!storedAuth) return;

        const authData: AuthData = JSON.parse(storedAuth);

        // Skip autoLogin redirect if we're already on the home page
        // This prevents redirect loops
        const isOnHomePage = window.location.pathname === "/home";
        const shouldRedirect =
          window.location.pathname === "/" && hasActiveSession;

        // Always restore auth state if we have stored data
        if (authData.walletId) {
          try {
            // Try to reconnect with the wallet if we have a walletId
            const wallet = createWallet(authData.walletId as any);
            const account = await wallet.getAccount();

            if (account) {
              // Update auth state
              setAuthData(authData);
              setIsAuthenticated(true);

              // Restore session
              sessionStorage.setItem(SESSION_KEY, "true");

              // Redirect if appropriate
              if (shouldRedirect && !isOnHomePage) {
                router.push("/home");
              }
            }
          } catch (e) {
            // Fall back to just using the stored address
            setAuthData(authData);
            setIsAuthenticated(true);

            // Restore session
            sessionStorage.setItem(SESSION_KEY, "true");

            // Redirect if appropriate
            if (shouldRedirect && !isOnHomePage) {
              router.push("/home");
            }
          }
        } else if (authData.address) {
          // Just use the stored address
          setAuthData(authData);
          setIsAuthenticated(true);

          // Restore session
          sessionStorage.setItem(SESSION_KEY, "true");

          // Redirect if appropriate
          if (shouldRedirect && !isOnHomePage) {
            router.push("/home");
          }
        }
      } catch (error) {
        console.error("Auto-login failed:", error);
        logout(); // Clear invalid auth data
      }
    };

    autoLogin();
  }, [router, autoConnect]); // Add autoConnect to dependencies

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
