"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DynamicFeatures from "@/components/home/dynamic-features";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, address } = useAuth();
  const { theme } = useTheme();
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Fetch balance from backend
  const fetchBalance = async (walletAddress: string) => {
    try {
      setIsLoadingBalance(true);
      const response = await fetch(`/api/balance?address=${walletAddress}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      const data = await response.json();
      setBalance(data.usdBalance || "0.00");
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.00");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Redirect to root if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to landing page");
      router.replace("/");
    } else {
      console.log("Authenticated on home page:", address);
      if (address) {
        fetchBalance(address);
      }
    }
  }, [isAuthenticated, router, address]);

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`flex items-center justify-center min-h-screen ${
          theme === "dark" ? "bg-[#0f0b22]" : "bg-white"
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
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col min-h-screen ${
        theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-[#f3f3f3] text-black"
      }`}
    >
      <div className="flex flex-col min-h-screen">
        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={`px-4 py-6 pt-[90px] border-b ${
            theme === "dark" ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Total balance
          </motion.div>
          <div className="flex items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
              className="text-4xl font-bold"
            >
              {isLoadingBalance ? (
                <span className="text-sm">Loading...</span>
              ) : (
                `$${balance}`
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className={`ml-2 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              ▶
            </motion.div>
          </div>
        </motion.div>

        {/* Dynamic Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <DynamicFeatures 
            refreshBalance={() => {
              if (address) {
                fetchBalance(address);
              }
            }} 
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
