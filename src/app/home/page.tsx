"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import DynamicFeatures from "@/components/home/dynamic-features";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react";
import { prepareTransaction, sendAndConfirmTransaction } from "thirdweb";
import { client, scrollSepolia } from "@/client";
import { Check, X, ExternalLink, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePoints } from "@/contexts/PointsContext";

// Storage key for last claim timestamp
const LAST_CLAIM_KEY = "last_claim_timestamp";

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const { refreshPoints } = usePoints();
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [progressValue, setProgressValue] = useState(100);
  const [hasAttemptedClaim, setHasAttemptedClaim] = useState(false);
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const [errorBannerVisible, setErrorBannerVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const account = useActiveAccount();

  // Load last claim time from localStorage
  // useEffect(() => {
  //   if (typeof window !== "undefined" && address) {
  //     try {
  //       const storedData = localStorage.getItem(`${LAST_CLAIM_KEY}_${address}`);
  //       if (storedData) {
  //         const timestamp = parseInt(storedData, 10);
  //         setLastClaimTime(timestamp);
  //       }
  //     } catch (error) {
  //       console.error("Error loading last claim time:", error);
  //     }
  //   }
  // }, [address]);

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
      // Refresh points after balance update
      refreshPoints();
      return data.usdBalance || "0.00";
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.00");
      return "0.00";
    } finally {
      setIsLoadingBalance(false);
    }
  };

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
      if (account?.address) {
        // Initial refresh
        fetchBalance(account.address);

        // Set up additional refresh attempts with increasing delays
        const refreshTimeouts = [
          setTimeout(() => fetchBalance(account.address), 3000),
        ];

        return () => {
          if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
          }
          // Clear all refresh timeouts
          refreshTimeouts.forEach((timeout) => clearTimeout(timeout));
        };
      }

      return () => {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
        }
      };
    }
  }, [txSuccess, txHash, account]);

  // Effect to handle error banner
  useEffect(() => {
    if (errorBannerVisible) {
      // Auto-hide error banner after 10 seconds
      errorTimerRef.current = setTimeout(() => {
        setErrorBannerVisible(false);
      }, 10000); // 10 seconds

      return () => {
        if (errorTimerRef.current) {
          clearTimeout(errorTimerRef.current);
        }
      };
    }
  }, [errorBannerVisible]);

  // Redirect to root if not authenticated and check balance for auto-claiming
  useEffect(() => {
    if (!account?.address) {
      router.replace("/");
    } else {
      const getBalanceAndAutoCheck = async () => {
        const currentBalance = await fetchBalance(account.address);
        checkAndClaimFunds(currentBalance);
      };
      getBalanceAndAutoCheck();
    }
  }, [account, router]);

  // Show error message
  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorBannerVisible(true);
  };

  // Check balance and claim funds if needed
  const checkAndClaimFunds = async (balanceValue: string) => {
    if (
      account &&
      account.address &&
      parseFloat(balanceValue) === 0 &&
      !hasAttemptedClaim &&
      !isTxProcessing
    ) {
      setHasAttemptedClaim(true);
      await handleClaimTestFunds();
    }
  };

  // Handle claiming test funds
  const handleClaimTestFunds = async () => {
    if (!account || !account.address) {
      return;
    }

    try {
      setIsTxProcessing(true);
      setTxSuccess(false);
      setTxHash(null);

      // Create transaction for USDC minting with proper types
      const data = `0xc6c3bbe60000000000000000000000002c9678042d52b97d27f2bd2947f7111d93f3dd0d000000000000000000000000${account.address.slice(
        2
      )}00000000000000000000000000000000000000000000000000000002540be400`;

      // Use the correct API: prepareTransaction first, then sendAndConfirmTransaction
      // This is safer than sendBatchTransaction and works with more wallet types
      const tx = prepareTransaction({
        to: "0x2F826FD1a0071476330a58dD1A9B36bcF7da832d",
        data: data as `0x${string}`,
        chain: scrollSepolia,
        client: client,
        value: BigInt(0),
      });

      // Use sendAndConfirmTransaction with the correct API signature
      const result = await sendAndConfirmTransaction({
        transaction: tx,
        account: account,
      });
      // Set success state and transaction hash
      setTxSuccess(true);
      setTxHash(result.transactionHash);
      // Add 5 points for testnet claim
      fetch("/api/points/testnet-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account.address }),
      })
        .then((res) => res.json())
        .then((data) => {})
        .catch((err) => {
          console.error("/api/points/testnet-claim error:", err);
        });
      // After successful claim, refresh points
      refreshPoints();
    } catch (error) {
      console.error("Transaction error:", error);
      const cleanErrorMessage =
        error instanceof Error
          ? error.message.split("contract:")[0].trim()
          : "Unknown error";
      showError(cleanErrorMessage);
    } finally {
      setIsTxProcessing(false);
    }
  };

  // Show loading state while checking authentication
  if (!account?.address) {
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
        theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-[#f0eef9] text-black"
      }`}
    >
      <div className="flex flex-col min-h-screen">
        {/* Transaction Success Banner */}
        {bannerVisible && (
          <div
            className={`fixed top-[80px] left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md 
            ${theme === "dark" ? "bg-green-900" : "bg-green-100"} 
            rounded-lg shadow-lg overflow-hidden`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div
                    className={`rounded-full p-1 mr-3 
                    ${theme === "dark" ? "bg-green-700" : "bg-green-200"}`}
                  >
                    <Check
                      className={`h-5 w-5 
                      ${
                        theme === "dark" ? "text-green-300" : "text-green-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-medium 
                      ${
                        theme === "dark" ? "text-green-100" : "text-green-800"
                      }`}
                    >
                      Funds Claimed Successfully
                    </h3>
                    <div className="mt-1 flex items-center">
                      <a
                        href={`https://sepolia-blockscout.scroll.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs flex items-center
                          ${
                            theme === "dark"
                              ? "text-green-300 hover:text-green-200"
                              : "text-green-700 hover:text-green-800"
                          }`}
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
                    ${
                      theme === "dark"
                        ? "hover:bg-green-800"
                        : "hover:bg-green-200"
                    }`}
                >
                  <X
                    className={`h-4 w-4 
                    ${theme === "dark" ? "text-green-300" : "text-green-600"}`}
                  />
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

        {/* Error Banner */}
        {errorBannerVisible && (
          <div
            className={`fixed top-[80px] left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md 
            ${theme === "dark" ? "bg-red-900" : "bg-red-100"} 
            rounded-lg shadow-lg overflow-hidden`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div
                    className={`rounded-full p-1 mr-3 
                    ${theme === "dark" ? "bg-red-700" : "bg-red-200"}`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 
                      ${theme === "dark" ? "text-red-300" : "text-red-600"}`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-medium 
                      ${theme === "dark" ? "text-red-100" : "text-red-800"}`}
                    >
                      <span className="font-bold">
                        Failed to Claim Test Funds:
                      </span>{" "}
                      Please try again later or reconnect your wallet.
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setErrorBannerVisible(false)}
                  className={`rounded-full p-1 
                    ${
                      theme === "dark" ? "hover:bg-red-800" : "hover:bg-red-200"
                    }`}
                >
                  <X
                    className={`h-4 w-4 
                    ${theme === "dark" ? "text-red-300" : "text-red-600"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Transaction Success Banner end */}

        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={`px-4 mt-[90px] border-b ${
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
            {/* button to claim test funds */}
            <button
              onClick={handleClaimTestFunds}
              disabled={isTxProcessing}
              className={`ml-auto px-3 py-1.5 text-xs font-medium rounded-lg
                ${
                  theme === "dark"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-white hover:bg-gray-400 text-black border border-gray-200"
                } transition-colors
                ${isTxProcessing ? "opacity-70 cursor-not-allowed" : ""}
              `}
            >
              {isTxProcessing ? "Processing..." : "Claim Test USDC"}
            </button>
          </motion.div>
          <div className="flex items-center justify-center py-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
              className="text-4xl font-normal"
            >
              {isLoadingBalance ? (
                <Skeleton className="w-32 h-7 rounded-sm bg-gray-300 dark:bg-gray-800" />
              ) : (
                `$${balance}`
              )}
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
              if (account?.address) {
                fetchBalance(account.address);
              }
            }}
          />
          <div className="flex justify-center mt-6">
            {/* This space is intentionally left for spacing below the investments section */}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
