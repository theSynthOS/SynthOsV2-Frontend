"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { client } from "@/client";
import { scroll } from "thirdweb/chains";
import {
  prepareTransaction,
  sendAndConfirmTransaction,
  sendBatchTransaction,
  waitForReceipt,
} from "thirdweb";
import Card from "@/components/ui/card";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { safeHaptic } from "@/lib/haptic-utils";
import { X, CheckCircle, ExternalLink } from "lucide-react";

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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [withdrawIds, setWithdrawIds] = useState<string[]>([]);

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

  // Reset form when modal opens
  useEffect(() => {
    if (pool) {
      setAmount("");
      setSelectedToken("USDC");
      setWithdrawError(null);
      setShowSuccessModal(false);
      setTxHash("");
      setTxProgressPercent(0);
      setSimulationStatus(null);
      setWithdrawIds([]);
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
      setSimulationStatus(null);
      setWithdrawIds([]);
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
      toast.error("Invalid Amount");
      return;
    }

    // Check if amount exceeds balance

    if (parseFloat(amount) > parseFloat(balance)) {
      toast.error("Insufficient Balance");
      return;
    }

    setIsSubmitting(true);

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
        if (!wallet || !account) {
          throw new Error("Wallet not connected");
        }

        // Extract transactions from callData
        if (!responseData || !Array.isArray(responseData.callData)) {
          throw new Error("Invalid response format: expected callData array");
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
            "0xa9059cbb", // transfer(address,uint256)
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
          const simulationResult = await simulateTransactionBundle(
            orderedTxs,
            account
          );
        } catch (simulationError) {
          const errorMessage =
            simulationError instanceof Error
              ? simulationError.message
              : String(simulationError);
          throw new Error(`Pre-execution simulation failed: ${errorMessage}`);
        }

        // Update progress after successful simulation
        setTxProgressPercent(55);

        // Prepare all transactions in the correct order (only after simulation passes)
        const transactions = orderedTxs.map((tx: any) =>
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
        } catch (error) {
          // Check if the error is because account doesn't support batch transactions
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          if (errorMessage) {
            // For EOAs, send transactions sequentially
            let lastTxResult;

            for (const tx of transactions) {
              lastTxResult = await sendAndConfirmTransaction({
                transaction: tx,
                account,
              });

              // Small delay between transactions to avoid nonce issues
              if (transactions.indexOf(tx) < transactions.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 500));
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
        setTxProgressPercent(95);

        // Handle success
        setTxHash(result.transactionHash);

        // Get transaction receipt to obtain block number
        let blockNumber: number | null = null;
        try {
          const receipt = await waitForReceipt({
            client: client,
            chain: scroll,
            transactionHash: result.transactionHash as `0x${string}`,
          });

          if (receipt && receipt.blockNumber) {
            blockNumber = Number(receipt.blockNumber);
          }
        } catch (receiptError) {
          // Continue without block number
        }

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
        // Handle success
        setShowSuccessModal(true);

        // Success haptic feedback
        safeHaptic("success");

        // Add a slight delay to make the loading state more visible
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        // Show user-friendly error message
        let errorMessage = "Transaction failed";
        if (error instanceof Error) {
          const errorString = error.message;
          if (errorString.includes("rejected transaction")) {
            errorMessage = "You rejected the transaction";
          } else if (errorString.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
          } else if (
            errorString.includes("0xe273b446") ||
            errorString.includes("AbiErrorSignatureNotFoundError")
          ) {
            errorMessage =
              "Withdrawal amount too high. Try withdrawing a slightly smaller amount";
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
        setSimulationStatus(null); // Clear simulation status on error

        toast.error(errorMessage);
      }
    } catch (error) {
      let errorMessage = "Failed to process withdrawal";
      if (error instanceof Error) {
        const errorString = error.message;
        if (errorString.includes("404")) {
          errorMessage = "Withdrawal service unavailable";
        } else if (errorString.includes("400")) {
          errorMessage = "Invalid withdrawal request";
        } else if (errorString.includes("500")) {
          errorMessage = "Server error occurred";
        } else {
          errorMessage = errorString;
        }
      }

      setWithdrawError(errorMessage);
      setTxProgressPercent(0);
      setSimulationStatus(null); // Clear simulation status on error

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
                      <Image
                        src="/usdc.png"
                        alt="USDC"
                        width={24}
                        height={24}
                      />
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
                      <Image
                        src="/usdt.png"
                        alt="USDT"
                        width={24}
                        height={24}
                      />
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
                  {simulationStatus ||
                    (txProgressPercent < 100
                      ? "Processing withdrawal..."
                      : "Withdrawal complete!")}
                </div>
              </div>
            )}

            {/* Simulation Status (when not submitting) */}
            {!isSubmitting && simulationStatus && (
              <div className="mt-4">
                <div className="text-xs text-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg py-2 px-3">
                  {simulationStatus}
                </div>
              </div>
            )}

            {/* Error Banner - Super simple design with formatted message */}
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
                  ${parseFloat(amount).toFixed(2)} {selectedToken}
                </p>
                <p className="text-sm mt-2 opacity-80">from {pool.name}</p>
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
