"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
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
    apy: number;
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
      setWithdrawError(null);
    }
  }, [pool]);

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setAmount("");
      setWithdrawError(null);
    }
    onClose();
  };

  // Handle withdraw confirmation
  const handleConfirmWithdraw = async () => {
    // Reset any previous errors
    setWithdrawError(null);

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
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_address: address,
          protocol_pair_id: pool?.protocol_pair_id ,
          amount: amount,
        }),
      });

      const responseData = await response.json();

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

        let result: { transactionHash: string };
        
        try {
          // First try to use batch transaction (works for smart accounts)
          result = await sendBatchTransaction({
            transactions,
            account,
          });
        } catch (error) {
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

        // Handle success
        toast({
          variant: "success",
          title: "Withdrawal Successful",
          description: `$${amount} withdrawn successfully`,
        });

        // Refresh balance
        if (refreshBalance) {
          refreshBalance();
        }

        // Close modal
        handleClose();

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

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
          {/* Amount Input Section */}
          <div>
            <label
              htmlFor="withdrawAmount"
              className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Amount to withdraw
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
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              disabled={isSubmitting}
            />
            {balance && (
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Available balance: ${balance}
              </p>
            )}
          </div>
        </div>

        {/* Withdraw Button - Fixed at the bottom */}
        <div className="mt-6 flex justify-center pt-2">
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
  );
}
