"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DynamicFeatures from "@/components/home/dynamic-features";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react";
import { prepareTransaction, sendBatchTransaction } from "thirdweb";
import { client, scrollSepolia } from "@/client";
import { Check, X, ExternalLink } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, address } = useAuth();
  const { theme } = useTheme();
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [progressValue, setProgressValue] = useState(100);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const account = useActiveAccount();

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

  // Effect to handle transaction success banner and progress bar
  useEffect(() => {
    if (txSuccess && txHash) {
      // Show the banner
      setBannerVisible(true);
      setProgressValue(100);
      
      // Start countdown timer for progress bar
      let timeLeft = 100;
      progressTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setProgressValue(timeLeft);
        
        if (timeLeft <= 0) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setBannerVisible(false);
        }
      }, 100); // Update every 100ms for smooth animation
      
      // Refresh balance after transaction success
      if (address) {
        // Initial refresh
        fetchBalance(address);
        
        // Set up additional refresh attempts with increasing delays
        const refreshTimeouts = [
          setTimeout(() => fetchBalance(address), 3000),
          setTimeout(() => fetchBalance(address), 6000),
        ];
        
        return () => {
          if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
          }
          // Clear all refresh timeouts
          refreshTimeouts.forEach(timeout => clearTimeout(timeout));
        };
      }
      
      return () => {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
        }
      };
    }
  }, [txSuccess, txHash, address]);

  // Handle claiming test funds
  const handleClaimTestFunds = async () => {
    if (!account || !account.address) {
      return;
    }

    try {
      setIsTxProcessing(true);
      setTxSuccess(false);
      setTxHash(null);
      
      // Prepare the transactions
      const transactions = [
        // Faucet drip transaction
        prepareTransaction({
          to: "0x602396FFA43b7FfAdc80e01c5A11fc74F3BA59f5",
          data: "0x434ab101",
          chain: scrollSepolia,
          client: client,
          value: BigInt(0),
        }),
        // USDC mint transaction
        prepareTransaction({
          to: "0x2F826FD1a0071476330a58dD1A9B36bcF7da832d",
          data: `0xc6c3bbe60000000000000000000000002c9678042d52b97d27f2bd2947f7111d93f3dd0d000000000000000000000000${account.address.slice(
            2
          )}00000000000000000000000000000000000000000000000000000002540be400`,
          chain: scrollSepolia,
          client: client,
          value: BigInt(0),
        }),
      ];

      // Send batch transaction
      const result = await sendBatchTransaction({
        transactions: transactions,
        account: account,
      });

      console.log("Transaction sent:", result);
      
      // Set success state and transaction hash
      setTxSuccess(true);
      setTxHash(result.transactionHash);
      
    } catch (error) {
      console.error("Transaction error:", error);
      const cleanErrorMessage =
        error instanceof Error
          ? error.message.split("contract:")[0].trim()
          : "Unknown error";
          
      toast({
        title: "Transaction failed",
        description: cleanErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTxProcessing(false);
    }
  };

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
        {/* Transaction Success Banner */}
        {bannerVisible && (
          <div className={`fixed top-[80px] left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md 
            ${theme === "dark" ? "bg-green-900" : "bg-green-100"} 
            rounded-lg shadow-lg overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`rounded-full p-1 mr-3 
                    ${theme === "dark" ? "bg-green-700" : "bg-green-200"}`}>
                    <Check className={`h-5 w-5 
                      ${theme === "dark" ? "text-green-300" : "text-green-600"}`} />
                  </div>
                  <div>
                    <h3 className={`font-medium 
                      ${theme === "dark" ? "text-green-100" : "text-green-800"}`}>
                      Funds Claimed Successfully
                    </h3>
                    <div className="mt-1 flex items-center">
                      <a 
                        href={`https://sepolia-blockscout.scroll.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs flex items-center
                          ${theme === "dark" ? "text-green-300 hover:text-green-200" : "text-green-700 hover:text-green-800"}`}
                      >
                        View Transaction
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setBannerVisible(false)}
                  className={`rounded-full p-1 
                    ${theme === "dark" ? "hover:bg-green-800" : "hover:bg-green-200"}`}
                >
                  <X className={`h-4 w-4 
                    ${theme === "dark" ? "text-green-300" : "text-green-600"}`} />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3 bg-gray-300 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-100 ease-linear"
                  style={{ width: `${progressValue}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

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
            } flex justify-between items-center`}
          >
            <span>Total balance</span>
            <button
              onClick={handleClaimTestFunds}
              disabled={isTxProcessing}
              className={`ml-auto px-3 py-1.5 text-xs font-medium rounded-lg
                ${theme === "dark" 
                  ? "bg-purple-600 hover:bg-purple-700 text-white" 
                  : "bg-green-600 hover:bg-green-700 text-white"
                } transition-colors
                ${isTxProcessing ? "opacity-70 cursor-not-allowed" : ""}
              `}
            >
              {isTxProcessing ? "Processing..." : "Claim Test USDC"}
            </button>
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
