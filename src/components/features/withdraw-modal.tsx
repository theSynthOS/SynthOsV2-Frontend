"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { X, CheckCircle, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { client } from "@/client";
import { scroll } from "thirdweb/chains";
import {
  prepareTransaction,
  sendAndConfirmTransaction,
  sendBatchTransaction,
} from "thirdweb";
import Card from "@/components/ui/card";
import Image from "next/image";

// Add Ethereum window type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params: any[] }) => Promise<any>;
    };
  }
}

interface WithdrawModalProps {
  pool: {
    name: string;
    apy: string;
    risk: string;
    pair_or_vault_name: string;
    protocol_id?: string;
    protocol_pair_id?: string;
  } | null;
  onClose: () => void;
  balance: string;
  isLoadingBalance?: boolean;
  address: string;
  refreshBalance?: () => void;
}

export default function WithdrawModal({
  pool,
  onClose,
  balance,
  isLoadingBalance = false,
  address,
  refreshBalance,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedToken, setSelectedToken] = useState<"USDC" | "USDT">("USDC");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [txProgressPercent, setTxProgressPercent] = useState(0);
  const { toast } = useToast();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (pool) {
      setAmount("");
      setSelectedToken("USDC");
      setWithdrawError(null);
      setShowSuccessModal(false);
      setTxHash("");
      setTxProgressPercent(0);
    }
  }, [pool]);

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting && !showSuccessModal) {
      setAmount("");
      setSelectedToken("USDC");
      setWithdrawError(null);
      setTxHash("");
      setTxProgressPercent(0);
    }
    onClose();
  };

  // Handle closing success modal and reset all values
  const handleCloseAll = () => {
    setShowSuccessModal(false);
    setAmount("");
    setSelectedToken("USDC");
    setWithdrawError(null);
    setTxHash("");
    setTxProgressPercent(0);
    
    // Refresh balance only when user closes the success modal
    // Add a small delay to ensure backend has processed the withdrawal
    if (refreshBalance) {
      setTimeout(() => {
        refreshBalance();
      }, 1000);
    }
    
    handleClose();
  };

  // Handle withdraw confirmation
  const handleConfirmWithdraw = async () => {
    // Reset any previous errors
    setWithdrawError(null);
    setTxProgressPercent(0);

    // Check if the amount is valid
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
      });
      return;
    }

    // Check if amount exceeds balance
    if (parseFloat(amount) > parseFloat(balance)) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds available balance",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update progress - start progress animation
      setTxProgressPercent(10);
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_address: address,
          protocol_pair_id: pool?.protocol_pair_id,
          amount: amount,
          withdrawToken: selectedToken, // Must be 'USDC' or 'USDT'
        }),
      });

      // Update progress
      setTxProgressPercent(30);

      const responseData = await response.json();

      // Update progress
      setTxProgressPercent(50);

      if (!response.ok) {
        throw new Error(responseData.message || "Withdrawal failed");
      }

      // Execute the withdrawal payload
      try {
        if (!wallet || !account) {
          throw new Error("Wallet not connected");
        }

        // Prepare all transactions
        const transactions = responseData.map((tx: any) =>
          prepareTransaction({
            to: tx.to,
            data: tx.data,
            chain: scroll,
            client: client,
            value: tx.value ? BigInt(tx.value) : BigInt(0),
          })
        );

        // Update progress
        setTxProgressPercent(60);

        let result: { transactionHash: string };
        
        // Update progress
        setTxProgressPercent(75);

        try {
          // First try to use batch transaction (works for smart accounts)
          result = await sendBatchTransaction({
            transactions,
            account,
          });
          console.log("result", result);
        } catch (error) {
          console.log("error", error);
          // Check if the error is because account doesn't support batch transactions
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (errorMessage) {
            console.log("Detected EOA wallet, falling back to sequential transactions");
            
            // For EOAs, send transactions sequentially
            let lastTxResult;
            
            for (const tx of transactions) {
              lastTxResult = await sendAndConfirmTransaction({
                transaction: tx,
                account,
              });
              
              // Small delay between transactions to avoid nonce issues
              if (transactions.indexOf(tx) < transactions.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            
            // Ensure we have a result
            if (!lastTxResult) {
              throw new Error("Transaction failed to execute");
            }
            
            result = lastTxResult;
          } else {
            // If it's some other error, rethrow it
            throw error;
          }
        }

        // Update progress to complete
        setTxProgressPercent(100);

        // Handle success
        setTxHash(result.transactionHash);
        setShowSuccessModal(true);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        // Add a slight delay to make the loading state more visible
        await new Promise((resolve) => setTimeout(resolve, 1500));

      } catch (error) {
        console.error("Withdrawal execution error:", error);

        // Show user-friendly error message
        let errorMessage = "Transaction failed";
        if (error instanceof Error) {
          const errorString = error.message;
          if (errorString.includes("rejected transaction")) {
            errorMessage = "You rejected the transaction";
          } else if (errorString.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
          } else if (
            errorString.includes("network") ||
            errorString.includes("connect")
          ) {
            errorMessage = "Network connection issue";
          } else {
            errorMessage = errorString.split(".")[0];
          }
        }

        setWithdrawError(errorMessage);
        setTxProgressPercent(0);

        toast({
          variant: "destructive",
          title: "Withdrawal Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Withdrawal API error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to process withdrawal";
      setWithdrawError(errorMessage);
      setTxProgressPercent(0);
      
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not mounted or no pool selected, return nothing
  if (!mounted || !pool) return null;

  return (
    <>
      {/* Main Withdraw Modal */}
      {!showSuccessModal ? (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
      <Card
        title={`Withdraw ${pool?.name} ${pool?.pair_or_vault_name}`}
        onClose={handleClose}
        className="max-h-[90vh] w-full max-w-md"
      >
        <div className="flex flex-col space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)] pb-4">
          {/* Token Selection Section */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}>
              Withdraw as:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedToken("USDC")}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedToken === "USDC"
                    ? theme === "dark"
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-purple-500 bg-purple-50 text-purple-700"
                    : theme === "dark"
                      ? "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                } ${isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Image src="/usdc.png" alt="USDC" width={24} height={24} />
                  <span className="font-medium">USDC</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedToken("USDT")}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedToken === "USDT"
                    ? theme === "dark"
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-purple-500 bg-purple-50 text-purple-700"
                    : theme === "dark"
                      ? "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                } ${isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Image src="/usdt.png" alt="USDT" width={24} height={24} />
                  <span className="font-medium">USDT</span>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input Section */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}>
              Amount to withdraw:
            </label>
            <input
              id="withdrawAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-3 rounded-lg border text-lg ${
                theme === "dark"
                  ? "bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              disabled={isSubmitting}
            />
            <div className="flex justify-end items-center my-2">
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  Balance: ${balance}
                </span>
                <button 
                  type="button"
                  onClick={() => setAmount(balance)}
                  disabled={isSubmitting || !balance}
                  className={`text-xs px-2 py-1 rounded ${
                    isSubmitting || !balance
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : theme === "dark" 
                      ? "bg-gray-700 text-blue-400 hover:bg-gray-600" 
                      : "bg-gray-100 text-blue-600 hover:bg-gray-200"
                  }`}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw Button - Fixed at the bottom */}
        <div className=" flex justify-center pt-2">
          <button
            className={`w-full py-3 rounded-lg relative ${
              isSubmitting
                ? "bg-gray-300 text-gray-500"
                : parseFloat(amount || "0") > 0
                ? "bg-[#8266E6] text-white hover:bg-[#3C229C]"
                : "bg-gray-300 text-gray-500"
            } transition-colors duration-200`}
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            onClick={handleConfirmWithdraw}
          >
            {isSubmitting ? (
              <>
                <span className="opacity-0">Withdraw</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-gray-500 border-t-gray-700 rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-700">Processing...</span>
                </div>
              </>
            ) : (
              <>
                Withdraw
                <svg 
                  className="inline-block ml-2 w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Transaction Progress */}
        {isSubmitting && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${txProgressPercent}%` }}
              ></div>
            </div>
            <div className="text-xs mt-1 text-right text-gray-500 dark:text-gray-400">
              {txProgressPercent < 100
                ? "Processing withdrawal..."
                : "Withdrawal complete!"}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {withdrawError && (
          <div
            className={`mt-4 rounded-lg p-3 ${
              theme === "dark" ? "bg-red-900/40" : "bg-red-100"
            } relative`}
          >
            <div className="pr-6">
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-red-100" : "text-red-800"
                } break-words`}
              >
                <span className="font-bold">Error:</span> {withdrawError}
              </p>
            </div>
            <button
              onClick={() => setWithdrawError(null)}
              className={`absolute top-2 right-2 rounded-full p-1 ${
                theme === "dark" ? "hover:bg-red-800" : "hover:bg-red-200"
              }`}
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}
      </Card>
    </div>
      ) : (
        /* Success Modal */
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && handleCloseAll()}
        >
          <Card
            title="Withdrawal Successful!"
            onClose={handleCloseAll}
            className="w-full max-w-md text-center"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-purple-500" />
              </div>

              <div className="mb-6">
                <p className="text-lg mb-1">You've withdrawn</p>
                <p className="text-3xl font-bold text-purple-500">
                  ${amount} {selectedToken}
                </p>
                <p className="text-sm mt-2 opacity-80">
                  from {pool.pair_or_vault_name}
                </p>
              </div>

              <div
                className={`w-full ${
                  theme === "dark"
                    ? "bg-white/5 border-white/60"
                    : "bg-gray-100"
                } p-4 rounded-lg mb-6 border`}
              >
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Withdrawn as</span>
                  <div className="flex items-center space-x-2">
                    <Image 
                      src={selectedToken === "USDC" ? "/usdc.png" : "/usdt.png"} 
                      alt={selectedToken} 
                      width={20} 
                      height={20} 
                    />
                    <span className="font-semibold">{selectedToken}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Link */}
              {txHash && (
                <a
                  href={`https://scrollscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center w-full ${
                    theme === "dark"
                      ? "bg-white/10 hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  } py-3 px-4 rounded-lg mb-4 transition-colors`}
                >
                  <span className="mr-2">View Transaction</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={handleCloseAll}
                className="w-full bg-[#8266E6] hover:bg-[#3C229C] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
