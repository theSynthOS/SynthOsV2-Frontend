"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { usePrivy } from '@privy-io/react-auth';
import { safeHaptic } from "@/lib/haptic-utils";

export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  // Check authentication state on initial load
  useEffect(() => {
    const checkAndUpsertUser = async () => {
      if (authenticated && user?.wallet?.address) {
        console.log("Checking and upserting user:", user.wallet.address);
        try {
          await fetch("/api/points", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: user.wallet.address }),
          });
        } catch (error) {
          console.error("Failed to save user data:", error);
        }
        // Only redirect after POST completes
        router.replace("/home");
      }
      setInitialAuthChecked(true);
    };

    if (ready) {
      checkAndUpsertUser();
    }
  }, [authenticated, user, router, ready]);

  // Handle wallet connected
  const handleWalletConnected = async () => {
    // Success haptic feedback for wallet connection
    safeHaptic("success");
    // Save user to database before redirect
    if (user?.wallet?.address) {
      console.log("Saving user to database:", user.wallet.address);
      try {
        await fetch("/api/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: user.wallet.address }),
        });
      } catch (error) {
        console.error("Failed to save user data:", error);
      }
    }

    // Redirect directly to home page after wallet connection
    router.push("/home");
  };

  // Wait until the Privy SDK is ready
  if (!ready || !initialAuthChecked) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          theme === "dark" ? "bg-[#0f0b22]" : "bg-[#f0eef9]"
        }`}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1, opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={`text-xl ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 ${
        theme === "dark" ? "bg-[#0f0b22]" : "bg-[#f0eef9]"
      }`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Image
            src="/SynthOS-transparent.png"
            alt="SynthOS Logo"
            width={120}
            height={120}
            className="mb-6"
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className={`text-5xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          SynthOS
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className={`text-xl font-bold mb-8 max-w-md text-center ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          AI-powered personalized crypto yield plans
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-2"
        >
          {authenticated ? (
            <div className="flex flex-col items-center space-y-4">
              <p className={`text-sm ${theme === "dark" ? "text-white" : "text-black"}`}>
                Connected: {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
              </p>
              <button
                onClick={logout}
                className="px-6 py-3 bg-[#8266E6] hover:bg-[#7255d5] text-white rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-6 py-3 bg-[#8266E6] hover:bg-[#7255d5] text-white rounded-lg font-medium transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
