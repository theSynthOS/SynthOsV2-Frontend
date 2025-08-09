"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { scroll } from "thirdweb/chains";
import {
  prepareTransaction,
  sendAndConfirmTransaction,
  sendBatchTransaction,
  waitForReceipt,
} from "thirdweb";
import Card from "@/components/ui/card";
import Image from "next/image";
import { toast } from "sonner";
import { safeHaptic } from "@/lib/haptic-utils";
import { X } from "lucide-react";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { ethers } from "ethers";

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
  const [txHash, setTxHash] = useState<string>("");
  const [txProgressPercent, setTxProgressPercent] = useState(0);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, authenticated } = usePrivy();
  const { displayAddress, smartWalletClient, wallets } = useSmartWallet();
  const [modalClosedDuringProcessingRef, setModalClosedDuringProcessingRef] =
    useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [withdrawIds, setWithdrawIds] = useState<string[]>([]);
  const [processingPoolId, setProcessingPoolId] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  const account =
    authenticated && displayAddress ? { address: displayAddress } : null;

  // Tenderly RPC bundled simulation function
  const simulateTransactionBundle = async (
    transactionData: any[],
    account: any
  ) => {
    try {
      setSimulationStatus(
        `Simulating ${transactionData.length} transactions...`
      );

      // Convert transaction data to Tenderly RPC format
      const transactionCalls = transactionData.map((tx) => {
        const call: any = {
          from: account.address,
          to: tx.to,
          data: tx.data,
        };

        // Only include value if it's not zero (to match Tenderly's expected format)
        if (tx.value && tx.value !== "0x0" && tx.value !== "0") {
          // Convert value to hex string if it's a decimal number
          const valueStr =
            typeof tx.value === "string" ? tx.value : tx.value.toString();
          call.value = valueStr.startsWith("0x")
            ? valueStr
            : `0x${Number(valueStr).toString(16)}`;
        }

        return call;
      });

      // Log the exact request format for debugging
      const requestBody = {
        method: "tenderly_simulateBundle",
        params: [
          transactionCalls,
          "latest", // Block parameter - use latest block
        ],
      };

      // Call Tenderly RPC tenderly_simulateBundle method
      const response = await fetch("/api/tenderly-rpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Tenderly RPC failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Tenderly RPC error: ${result.error.message}`);
      }

      const simulationResults = result.result;

      if (!simulationResults || !Array.isArray(simulationResults)) {
        throw new Error("Invalid simulation results format");
      }

      // Check if ALL transactions have status: true
      const failedTransactions = simulationResults.filter(
        (result: any, index: number) => {
          const success = result.status === true;

          // Log failure details for debugging
          if (!success) {
          }

          return !success;
        }
      );

      if (failedTransactions.length > 0) {
        // Check for specific "RouteProcessor: Unknown pool type" error
        const hasRouteProcessorError = failedTransactions.some(
          (failed: any) => {
            // Check if there's a trace with the specific error reason
            if (failed.trace && Array.isArray(failed.trace)) {
              return failed.trace.some(
                (traceEntry: any) =>
                  traceEntry.errorReason === "RouteProcessor: Unknown pool type"
              );
            }
            return false;
          }
        );

        if (hasRouteProcessorError) {
          throw new Error(
            "Please try a different token or withdraw amount or try again later."
          );
        }

        // Default error handling for other failures
        const errorMessages = failedTransactions
          .map((failed: any, index: number) => {
            const actualIndex =
              simulationResults.findIndex((r) => r === failed) + 1;
            const reason =
              failed.revertReason || failed.error || `status: ${failed.status}`;
            return `Transaction ${actualIndex}: ${reason}`;
          })
          .join("; ");

        throw new Error(`Bundle simulation failed: ${errorMessages}`);
      }

      // Calculate total gas used
      const totalGasUsed = simulationResults.reduce(
        (total: number, result: any) => {
          const gasUsed = parseInt(result.gasUsed || "0x0", 16);
          return total + gasUsed;
        },
        0
      );

      // Update status for success
      setSimulationStatus("✅ All transactions validated successfully");
      setTimeout(() => setSimulationStatus(null), 1500);

      return {
        success: true,
        totalGasUsed,
        results: simulationResults,
      };
    } catch (error) {
      setSimulationStatus("❌ Simulation failed");
      setTimeout(() => setSimulationStatus(null), 2000);
      throw error;
    }
  };

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal opens with a different pool
  useEffect(() => {
    if (pool) {
      // Only reset state if this is a different pool than the one being processed
      if (!processingPoolId || processingPoolId !== pool.protocol_pair_id) {
        setAmount("");
        setSelectedToken("USDC");
        setWithdrawError(null);
        setTxHash("");
        setTxProgressPercent(0);
        setSimulationStatus(null);
        setWithdrawIds([]);
        isProcessingRef.current = false;
        setModalClosedDuringProcessingRef(false);
      }
    }
  }, [pool, processingPoolId]);

  // Handle modal close
  const handleClose = () => {
    if (isSubmitting) {
      // Mark that modal was closed during processing
      setModalClosedDuringProcessingRef(true);
      // Show a toast notification that transaction is still processing
      toast.info("Transaction in Progress", {
        description:
          "Your withdrawal is still processing in the background. You'll be notified when it completes.",
      });
    }
    if (!isSubmitting) {
      // Only reset if not currently processing
      if (!isProcessingRef.current) {
        setAmount("");
        setSelectedToken("USDC");
        setWithdrawError(null);
        setTxHash("");
        setTxProgressPercent(0);
        setSimulationStatus(null);
        setWithdrawIds([]);
      }
    }
    onClose();
  };

  // Handle closing success modal and reset all values
  const handleCloseAll = () => {
    setAmount("");
    setSelectedToken("USDC");
    setWithdrawError(null);
    setTxHash("");
    setTxProgressPercent(0);
    setSimulationStatus(null);
    setWithdrawIds([]);

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
    // Haptic feedback for critical financial action
    safeHaptic("heavy");
    // Reset any previous errors
    setWithdrawError(null);
    setTxProgressPercent(0);
    setSimulationStatus(null);

    // Check if the amount is valid
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid withdrawal amount",
      });
      return;
    }

    // Check if amount exceeds balance
    if (parseFloat(amount) > parseFloat(balance)) {
      toast.error("Insufficient Balance", {
        description: "Withdrawal amount exceeds available balance",
      });
      return;
    }

    setIsSubmitting(true);
    isProcessingRef.current = true;
    if (pool?.protocol_pair_id) {
      setProcessingPoolId(pool.protocol_pair_id);
    }

    const toastId = toast.loading("Preparing Withdrawal", {
      description: "Preparing your withdrawal request...",
    });

    try {
      // Update progress - start progress animation
      setTxProgressPercent(10);

      // Check if withdrawal amount is within 2% tolerance of maximum balance
      const maxBalance = parseFloat(balance);
      const withdrawAmount = parseFloat(amount);
      const tolerance = maxBalance * 0.02; // 2% tolerance
      const isMaxWithdraw = maxBalance - withdrawAmount <= tolerance;

      const requestBody = {
        user_address: address,
        protocol_pair_id: pool?.protocol_pair_id,
        amount: amount,
        withdrawToken: selectedToken, // Must be 'USDC' or 'USDT'
        ...(isMaxWithdraw && { maxWithdraw: true }), // Add maxWithdraw flag if within tolerance
      };

      const response = await fetch("/api/withdraw-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Update progress
      setTxProgressPercent(30);

      const responseData = await response.json();

      // Store withdrawIds for later database update
      const withdrawalPlan = responseData.withdrawalPlan || [];

      if (Array.isArray(withdrawalPlan) && withdrawalPlan.length > 0) {
        setWithdrawIds(withdrawalPlan);
      }

      // Update progress
      setTxProgressPercent(50);

      if (!response.ok) {
        throw new Error(responseData.message || "Withdrawal failed");
      }

      // Execute the withdrawal payload
      try {
        if (!authenticated || !displayAddress) {
          throw new Error("No wallet connected");
        }

        // Extract transactions from callData
        if (!responseData || !Array.isArray(responseData.callData)) {
          throw new Error(
            " We are experiencing high investment volumes, please try again later."
          );
        }

        const transactionData = responseData.callData;

        // Function to check if a transaction is an approval
        const isApprovalTransaction = (data: string): boolean => {
          if (!data || data.length < 10) return false;

          // Extract function selector (first 4 bytes after 0x)
          const functionSelector = data.slice(0, 10).toLowerCase();

          // Common ERC20 approval function selectors
          const approvalSelectors = [
            "0x095ea7b3", // approve(address,uint256)
          ];

          return approvalSelectors.includes(functionSelector);
        };

        // Reorder transactions to put approvals first
        const approvalTxs = transactionData.filter((tx: any) =>
          isApprovalTransaction(tx.data)
        );
        const nonApprovalTxs = transactionData.filter(
          (tx: any) => !isApprovalTransaction(tx.data)
        );
        const orderedTxs = [...approvalTxs, ...nonApprovalTxs];

        // Simulate the transaction bundle with Tenderly RPC
        try {
          if (!modalClosedDuringProcessingRef) {
            setSimulationStatus("Simulating transactions...");
          }
          toast.loading("Simulating Transaction", {
            id: toastId,
            description: "Validating your withdrawal request...",
          });

          const simulationResult = await simulateTransactionBundle(orderedTxs, {
            address: displayAddress,
          });

          if (!modalClosedDuringProcessingRef) {
            setSimulationStatus("✅ All transactions validated successfully");
          }
          toast.loading("Processing Transaction", {
            id: toastId,
            description: "Confirming withdrawal...",
          });
        } catch (simulationError) {
          const errorMessage =
            simulationError instanceof Error
              ? simulationError.message
              : String(simulationError);
          throw new Error(errorMessage);
        }

        // Update progress
        setTxProgressPercent(60);

        let result: { transactionHash: string };

        try {
          // Execute transactions sequentially using Privy's sendTransaction
          let lastTxResult: any = null;
          let calls: any = [];

          for (const tx of orderedTxs) {
            calls.push({
              to: tx.to,
              data: tx.data,
              value: tx.value ? BigInt(tx.value) : BigInt(0),
            });
          }

          lastTxResult = await smartWalletClient.sendTransaction({
            calls,
          });

          if (!lastTxResult) {
            throw new Error("Transaction failed to execute");
          }

          const maybeHash = (lastTxResult &&
            (lastTxResult.hash || lastTxResult)) as string;
          result = { transactionHash: maybeHash };

          toast.loading("Transaction Submitted", {
            id: toastId,
            description:
              "Your withdrawal request has been submitted to the network",
          });
        } catch (error) {
          throw error;
        }

        // Update progress to complete
        setTxProgressPercent(85);

        // Handle success
        setTxHash(result.transactionHash);

        // Get block number from the transaction receipt
        let blockNumber: number | undefined = undefined;

        try {
          const provider = await wallets[0].getEthereumProvider();
          const ethersProvider = new ethers.BrowserProvider(provider);
          const receipt = await ethersProvider.getTransactionReceipt(
            result.transactionHash
          );
          blockNumber = receipt?.blockNumber;
        } catch (receiptError) {
          console.error("Error getting transaction receipt:", receiptError);
        }

        setTxProgressPercent(90);

        // Update withdrawal record in database with transaction details
        // Use the local withdrawalIds variable instead of state (which updates asynchronously)
        if (
          withdrawalPlan &&
          Array.isArray(withdrawalPlan) &&
          withdrawalPlan.length > 0
        ) {
          try {
            const updateResponse = await fetch("/api/update-withdraw-tx", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                withdrawalPlan: withdrawalPlan,
                transactionHash: result.transactionHash as `0x${string}`,
                blockNumber: blockNumber,
              }),
            });
          } catch (updateError) {
            // Continue with success flow even if update fails
            console.warn("Error updating withdrawal transaction:", updateError);
          }
        } else {
          console.warn(
            "No withdrawalPlan available for update:",
            withdrawalPlan
          );
        }

        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: address,
            hash: result.transactionHash,
            amount: amount,
            type: "withdraw",
            status: "completed",
          }),
        });

        const data = await response.json();
        if (!data.success) {
        } else {
        }

        setTxProgressPercent(100);

        // After successful withdrawal
        isProcessingRef.current = false;
        setProcessingPoolId(null);

        // Success haptic feedback
        safeHaptic("success");

        // Show success toast and close modal
        toast.success("Withdrawal Successful", {
          id: toastId,
          description: `Successfully withdrawn ${amount} ${selectedToken}`,
          duration: 5000,
          action: {
            label: "View Transaction",
            onClick: () =>
              window.open(
                `https://scrollscan.com/tx/${result.transactionHash}`,
                "_blank"
              ),
          },
        });

        // Close modal and refresh balance
        onClose();
        if (refreshBalance) {
          setTimeout(() => {
            refreshBalance();
          }, 1000);
        }

        // Add a slight delay to make the loading state more visible
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        // Show user-friendly error message
        let errorMessage = "Transaction failed";
        let errorDescription = "Please try again or contact support";

        if (error instanceof Error) {
          const errorString = error.message;
          if (errorString.includes("rejected transaction")) {
            errorMessage = "Transaction Cancelled";
            errorDescription = "You rejected the transaction";
          } else if (errorString.includes("insufficient funds")) {
            errorMessage = "Insufficient Funds";
            errorDescription =
              "You don't have enough funds for this transaction";
          } else if (
            errorString.includes("0xe273b446") ||
            errorString.includes("AbiErrorSignatureNotFoundError")
          ) {
            errorMessage = "Amount Too High";
            errorDescription = "Try withdrawing a slightly smaller amount";
          } else if (
            errorString.includes("network") ||
            errorString.includes("connect")
          ) {
            errorMessage = "Network Error";
            errorDescription = "Please check your internet connection";
          } else {
            errorMessage = errorString.split(".")[0];
            errorDescription = "An unexpected error occurred";
          }
        }

        setWithdrawError(errorMessage);
        setTxProgressPercent(0);
        setSimulationStatus(null); // Clear simulation status on error

        toast.error(errorMessage, {
          id: toastId,
          description: errorDescription,
        });
      }
    } catch (error) {
      let errorMessage = "Failed to process withdrawal";
      let errorDescription = "Please try again later";

      if (error instanceof Error) {
        const errorString = error.message;
        if (errorString.includes("404")) {
          errorMessage = "Service Unavailable";
          errorDescription = "Withdrawal service is currently unavailable";
        } else if (errorString.includes("400")) {
          errorMessage = "Invalid Request";
          errorDescription = "Please check your withdrawal details";
        } else if (errorString.includes("500")) {
          errorMessage = "Server Error";
          errorDescription = "An internal server error occurred";
        } else {
          errorMessage = errorString;
          errorDescription = "An unexpected error occurred";
        }
      }

      setWithdrawError(errorMessage);
      setTxProgressPercent(0);
      setSimulationStatus(null); // Clear simulation status on error

      toast.error(errorMessage, {
        id: toastId,
        description: errorDescription,
      });
    } finally {
      setIsSubmitting(false);
      setModalClosedDuringProcessingRef(false);
      if (!modalClosedDuringProcessingRef) {
        isProcessingRef.current = false;
        setProcessingPoolId(null);
      }
    }
  };

  // If not mounted or no pool selected, return nothing
  if (!mounted || !pool) return null;

  // Function to format error messages for display
  const formatErrorMessage = (errorMsg: string): string => {
    // For general errors, limit to reasonable length
    if (errorMsg.length > 100) {
      return errorMsg.substring(0, 97) + "...";
    }

    return errorMsg;
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[999] overflow-hidden"
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
            <label
              className={`block text-sm font-medium mb-3 ${
                theme === "dark" ? "text-gray-200" : "text-gray-700"
              }`}
            >
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
                } ${
                  isSubmitting
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
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
                } ${
                  isSubmitting
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
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
            <label
              className={`block text-sm font-medium mb-3 ${
                theme === "dark" ? "text-gray-200" : "text-gray-700"
              }`}
            >
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
                <span
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Balance: ${parseFloat(balance).toFixed(2)}
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
        <div className="flex justify-center pt-2">
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
              {simulationStatus ||
                (txProgressPercent < 100
                  ? "Processing withdrawal..."
                  : "Withdrawal complete!")}
            </div>
          </div>
        )}

        {/* Simulation Status */}
        {!isSubmitting && simulationStatus && (
          <div className="mt-4">
            <div className="text-xs text-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg py-2 px-3">
              {simulationStatus}
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
                <span className="font-bold">Error:</span>{" "}
                {formatErrorMessage(withdrawError)}
              </p>
            </div>
            <button
              onClick={() => setWithdrawError(null)}
              className={`absolute top-2 right-2 rounded-full p-1 ${
                theme === "dark" ? "hover:bg-red-800" : "hover:bg-red-200"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
