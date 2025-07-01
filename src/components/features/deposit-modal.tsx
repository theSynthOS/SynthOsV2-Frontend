"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, ExternalLink, X, Copy, Info } from "lucide-react";
import { useTheme } from "next-themes";
import { RadialProgressBar } from "@/components/circular-progress-bar/Radial-Progress-Bar";
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Add Ethereum window type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params: any[] }) => Promise<any>;
    };
  }
}

interface DepositModalProps {
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

export default function DepositModal({
  pool,
  onClose,
  balance,
  isLoadingBalance = false,
  address,
  refreshBalance,
}: DepositModalProps) {
  const [amount, setAmount] = useState<string>("0");
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxBalance, setMaxBalance] = useState(Number(balance) || 0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [percentageButtonClicked, setPercentageButtonClicked] = useState(false);
  const isProcessingRef = useRef(false);
  const lastCalculatedAmountRef = useRef<string>("0");
  const submittedAmountRef = useRef<string>("0");
  const [currentApy, setCurrentApy] = useState<number | null>(null);
  const [isLoadingApy, setIsLoadingApy] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [processingPoolId, setProcessingPoolId] = useState<string | null>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const [depositError, setDepositError] = useState<string | null>(null);
  const [txProgressPercent, setTxProgressPercent] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const refreshTimersRef = useRef<NodeJS.Timeout[]>([]);
  const [localIsLoadingBalance, setLocalIsLoadingBalance] = useState(false);
  const [minimumDeposits, setMinimumDeposits] = useState<any>(null);
  const [isLoadingMinimumDeposits, setIsLoadingMinimumDeposits] =
    useState(false);

  // Keep track of the previous maxBalance value to handle transitions
  const prevMaxBalanceRef = useRef(maxBalance);

  // Add a reference to track if modal is closed during processing
  const modalClosedDuringProcessingRef = useRef(false);

  // Add a reference to track deposit status for each pool
  // This will help maintain state even when modal is closed and reopened
  const [completedDeposits, setCompletedDeposits] = useState<{
    [poolId: string]: {
      success: boolean;
      amount: string;
      txHash: string;
    };
  }>({});

  // Add a ref to store the yearly yield at the time of submission
  const submittedYearlyYieldRef = useRef<number>(0);

  // Minimum deposit configuration for specific protocols
  const getMinimumDeposit = (protocolName: string): number => {
    if (protocolName.toLowerCase() === "tempest") {
      return 10; // $10 minimum for tempest
    }
    return 0; // No minimum for other protocols
  };

  const minimumDeposit = pool ? getMinimumDeposit(pool.name) : 0;

  // Reset state when the modal is opened with a different pool
  useEffect(() => {
    if (pool) {
      // Check if this pool has a completed deposit
      if (pool.protocol_pair_id && completedDeposits[pool.protocol_pair_id]) {
        // Don't reset state for completed deposits, as we'll show the success modal
        return;
      }

      // Only reset state if this is a different pool than the one being processed
      if (!processingPoolId || processingPoolId !== pool.protocol_pair_id) {
        setAmount("0");
        lastCalculatedAmountRef.current = "0";
        setSliderValue(0);
        setPercentageButtonClicked(false);
        setIsSubmitting(false);
        isProcessingRef.current = false;
        // Reset the modalClosedDuringProcessingRef flag when opening a new modal
        modalClosedDuringProcessingRef.current = false;
      }
    }
  }, [pool, processingPoolId, completedDeposits]);

  // Fetch APY for the selected pool
  useEffect(() => {
    if (pool?.protocol_pair_id) {
      const fetchApy = async () => {
        setIsLoadingApy(true);
        try {
          const response = await fetch(
            `/api/protocol-pairs-apy?id=${pool.protocol_pair_id}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch APY data");
          }
          const data = await response.json();
          // Find the matching protocol pair
          const pairData = Array.isArray(data)
            ? data.find((pair) => pair.id === pool.protocol_pair_id)
            : null;

          if (pairData && pairData.apy !== undefined) {
            setCurrentApy(pairData.apy);
          } else {
            // Fallback to the APY provided in the pool prop
            setCurrentApy(pool.apy || 0);
          }
        } catch {
          // Fallback to the APY provided in the pool prop
          setCurrentApy(pool.apy || 0);
        } finally {
          setIsLoadingApy(false);
        }
      };

      fetchApy();
    } else {
      // If no pool is selected, use the provided APY
      setCurrentApy(pool?.apy || 0);
    }
  }, [pool]);

  // Fetch minimum deposits data
  useEffect(() => {
    const fetchMinimumDeposits = async () => {
      setIsLoadingMinimumDeposits(true);
      try {
        const response = await fetch("/api/minimum-deposits");
        if (!response.ok) {
          throw new Error("Failed to fetch minimum deposits");
        }
        const data = await response.json();

        // Convert array response to lookup object keyed by protocol_pair_id
        const minimumDepositsLookup: { [key: string]: number } = {};
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item.protocol_pair_id && item.minimum_deposit_usd) {
              minimumDepositsLookup[item.protocol_pair_id] = parseFloat(
                item.minimum_deposit_usd
              );
            }
          });
        }

        setMinimumDeposits(minimumDepositsLookup);
      } catch (error) {
        console.error("Error fetching minimum deposits:", error);
        // Set fallback minimum if API fails
        setMinimumDeposits({ default: 10 });
      } finally {
        setIsLoadingMinimumDeposits(false);
      }
    };

    fetchMinimumDeposits();
  }, []);

  // Update maxBalance when balance prop changes
  useEffect(() => {
    const newBalance = Number(balance) || 0;
    setMaxBalance(newBalance);
    // Reset amount and slider when balance changes
    setAmount("0");
    lastCalculatedAmountRef.current = "0";
    setSliderValue(0);
    setPercentageButtonClicked(false);
  }, [balance]);

  // Also fetch balance directly when the modal opens to ensure we have the latest
  useEffect(() => {
    if (pool && address) {
      // Fetch balance directly when modal opens
      fetchBalance();
    }
  }, [pool, address]);

  // Handle maxBalance updates while maintaining the percentage
  useEffect(() => {
    if (pool) {
      if (prevMaxBalanceRef.current !== maxBalance) {
        // Store the previous maxBalance
        prevMaxBalanceRef.current = maxBalance;

        // The slider value (percentage) should remain the same
        // Only the absolute amount needs to be recalculated
        const currentPercentage = sliderValue;
        const newAmount = (
          Math.floor((currentPercentage / 100) * maxBalance * 100) / 100
        ).toFixed(2);
        setAmount(newAmount);
        lastCalculatedAmountRef.current = newAmount;
      }
    }
  }, [maxBalance, pool, sliderValue]);

  // Handle modal close and reset values
  const handleClose = () => {
    // If submitting, mark that modal was closed during processing but don't reset state
    if (isSubmitting) {
      // Just mark that the modal was closed during processing
      modalClosedDuringProcessingRef.current = true;

      // Show a toast notification that transaction is still processing
      toast.success("Your deposit is still processing in the background.", {
        autoClose: 5000,
      });
    } else if (!showSuccessModal) {
      // Only reset values if not showing success modal and not submitting
      setAmount("0");
      lastCalculatedAmountRef.current = "0";
      setSliderValue(0);
      setPercentageButtonClicked(false);
      // Clear any error messages
      setDepositError(null);
      setTxProgressPercent(0);
    }
    // Always call onClose to close the modal
    onClose();
  };

  // Direct balance fetching function
  const fetchBalance = async () => {
    if (!address) return;

    try {
      setLocalIsLoadingBalance(true);

      const response = await fetch(`/api/balance?address=${address}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      const data = await response.json();
      const newBalance = data.totalUsdBalance || "0.00";

      // Update the local maxBalance state
      setMaxBalance(Number(newBalance));

      // Also call the parent's refreshBalance if available
      if (refreshBalance) {
        refreshBalance();
      }

      return newBalance;
    } catch {
      return "0.00";
    } finally {
      setLocalIsLoadingBalance(false);
    }
  };

  // Enhanced fetchBalance function that combines direct fetch and parent refresh
  const fetchBalanceAndUpdate = async () => {
    try {
      // First try direct fetch for immediate UI update
      await fetchBalance();

      // The parent's refreshBalance will be called inside fetchBalanceDirectly
    } catch {
      // Fallback to parent's refreshBalance if direct fetch fails
      if (refreshBalance) {
        refreshBalance();
      }
    }
  };

  // Clear all refresh timers when component unmounts or when needed
  const clearAllRefreshTimers = () => {
    if (refreshTimersRef.current.length > 0) {
      refreshTimersRef.current.forEach((timer) => clearTimeout(timer));
      refreshTimersRef.current = [];
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearAllRefreshTimers();
    };
  }, []);

  // Handle closing success modal and reset all values
  const handleCloseAll = () => {
    setShowSuccessModal(false);
    isProcessingRef.current = false;
    setProcessingPoolId(null); // Clear the processing pool ID
    setAmount("0");
    lastCalculatedAmountRef.current = "0";
    setSliderValue(0);
    setPercentageButtonClicked(false);
    modalClosedDuringProcessingRef.current = false;

    // Clear all refresh timers
    clearAllRefreshTimers();

    // Refresh balance one more time before closing
    fetchBalanceAndUpdate();

    // Clear completed deposit status for this pool
    if (pool?.protocol_pair_id) {
      setCompletedDeposits((prev) => {
        const newState = { ...prev };
        delete newState[pool.protocol_pair_id as string];
        return newState;
      });
    }

    handleClose();
  };

  // Set mounted state and handle scroll lock
  useEffect(() => {
    setMounted(true);
  }, [pool]);

  // Handle radial progress update
  const handleRadialProgressUpdate = (progressPercentage: number) => {
    if (isProcessingRef.current) {
      return;
    }

    // Make sure progressPercentage is valid
    if (progressPercentage === undefined || progressPercentage === null) {
      return;
    }

    // Check if this is coming from one of the percentage buttons
    const isPercentageButton =
      progressPercentage === 25 ||
      progressPercentage === 50 ||
      progressPercentage === 75 ||
      progressPercentage === 100;

    // If it's from a percentage button, set our flag
    if (isPercentageButton) {
      setPercentageButtonClicked(true);
    }

    // If it's a real drag interaction, clear the percentage button flag
    if (!isPercentageButton && progressPercentage > 0) {
      setPercentageButtonClicked(false);
    }

    // Use exact percentage value without forcing minimum
    const validPercentage = progressPercentage;

    // Update the slider value state
    setSliderValue(validPercentage);

    // Calculate the new amount based on the percentage of maxBalance
    // Ensure we get at least 2 decimal places
    const calculatedAmount = (
      Math.floor((validPercentage / 100) * maxBalance * 100) / 100
    ).toFixed(2);

    // Store in ref immediately (not affected by React's async state updates)
    lastCalculatedAmountRef.current = calculatedAmount;

    // Update the amount state - ensure it's a string with at least 2 decimal places
    setAmount(calculatedAmount);
  };

  // Calculate estimated yearly yield using the fetched APY
  const yearlyYield = (Number.parseFloat(amount) * (currentApy || 0)) / 100;

  // Helper function to get minimum deposit amount for current pool
  const getMinimumDepositAmount = (): number => {
    if (!minimumDeposits || !pool?.protocol_pair_id) {
      return 10; // Default fallback
    }

    // Direct lookup by protocol_pair_id since minimumDeposits is now a lookup object
    const poolMinimum = minimumDeposits[pool.protocol_pair_id];
    return poolMinimum || 10; // Fallback to 10 if not found
  };

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

  // Handle confirmation of transaction success
  const handleTransactionSuccess = async (txHash: string, amount: string) => {
    try {
      // Set transaction hash
      setTxHash(txHash);

      // Immediately fetch balance after transaction success
      // This ensures we get the latest balance as soon as possible
      await fetchBalance();

      // Set up a timeout for a second fetch attempt
      setTimeout(async () => {
        await fetchBalance();

        // Third attempt after another delay
        setTimeout(async () => {
          await fetchBalance();
        }, 3000);
      }, 1500);

      // Update deposit tracking state
      if (pool?.protocol_pair_id) {
        const poolId = pool.protocol_pair_id;
        setCompletedDeposits((prev) => ({
          ...prev,
          [poolId]: {
            success: true,
            amount: amount,
            txHash: txHash,
          },
        }));
      }

      // Show success UI
      if (!modalClosedDuringProcessingRef.current) {
        setShowSuccessModal(true);
      } else {
        toast.success(`$${amount} deposited into ${pool?.name}`);
      }

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Add 10 points for deposit only if amount >= 10
      if (parseFloat(amount) >= 10) {
        fetch("/api/points/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        })
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            // Fetch updated points
            return fetch(
              `/api/points?address=${encodeURIComponent(address ?? "")}`
            );
          })
          .then((res) => {
            return res.json();
          })
          .then((data) => {})
          .catch(() => {});

        // Add referral points logic
        fetch("/api/referral-points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: address,
            amount: amount,
          }),
        })
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            if (data.success && data.pointsAdded > 0) {
              toast.success(`Referral bonus: +${data.pointsAdded} points!`);
            }
          })
          .catch(() => {});
      }

      // Save transaction to database
      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: address,
            hash: txHash,
            amount: amount,
            type: "deposit",
            status: "completed",
          }),
        });

        const data = await response.json();
        if (!data.success) {
        } else {
        }
      } catch (error) {}
    } catch (error) {
      toast.error("Deposit failed");
    }
  };

  // Handle deposit confirmation
  const handleConfirmDeposit = async () => {
    // Get the current amount value from our ref for consistent access
    // This ensures we use the most recent amount calculation, even if state hasn't updated yet
    const depositAmount = lastCalculatedAmountRef.current || amount;

    // Store the final submitted amount for success screen
    submittedAmountRef.current = depositAmount;

    // Store the yearly yield calculation for success screen
    submittedYearlyYieldRef.current =
      (Number.parseFloat(depositAmount) * (currentApy || 0)) / 100;

    // Reset any previous errors
    setDepositError(null);
    setTxProgressPercent(0);
    setSimulationStatus(null);

    // Check if the amount is valid
    if (parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }

    // Check if minimum deposits data is still loading
    if (isLoadingMinimumDeposits) {
      toast.error("Loading deposit requirements, please wait...");
      return;
    }

    // Dynamic minimum deposit validation
    const minDepositAmount = getMinimumDepositAmount();
    if (parseFloat(depositAmount) < minDepositAmount) {
      toast.error(
        `Minimum deposit amount for this pool is $${minDepositAmount}`
      );
      return;
    }

    // Check if deposit amount exceeds balance
    if (parseFloat(depositAmount) > maxBalance) {
      toast.error("Deposit amount exceeds available balance");
      return;
    }

    // Check for reasonable maximum (optional safety check)
    const MAX_DEPOSIT_AMOUNT = 1000000; // $1M maximum
    if (parseFloat(depositAmount) > MAX_DEPOSIT_AMOUNT) {
      toast.error(
        `Maximum deposit amount is $${MAX_DEPOSIT_AMOUNT.toLocaleString()}`
      );
      return;
    }

    // Set processing flag to prevent RadialProgressBar updates
    isProcessingRef.current = true;

    // Start the loading state and track which pool is being processed
    setIsSubmitting(true);
    if (pool?.protocol_pair_id) {
      setProcessingPoolId(pool.protocol_pair_id);
    }

    let depositId: string | null = null;

    try {
      // Update progress - start progress animation
      setTxProgressPercent(10);

      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_address: address,
          protocol_pair_id: pool?.protocol_pair_id,
          amount: depositAmount,
        }),
      });

      // Update progress
      setTxProgressPercent(30);

      const responseData = await response.json();

      // Store depositId for later database update
      depositId = responseData.depositId;
      if (!depositId) {
        throw new Error("No depositId received from server");
      }

      // Update progress
      setTxProgressPercent(50);

      // Execute the deposit payload
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

        // Update progress
        setTxProgressPercent(60);

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
        setTxProgressPercent(65);

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
        setTxProgressPercent(75);

        let result: { transactionHash: string };

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
        setTxProgressPercent(100);

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

        // Update deposit record in database with transaction details
        try {
          const updateResponse = await fetch("/api/update-deposit-tx", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              depositId: depositId,
              transactionHash: result.transactionHash as `0x${string}`,
              blockNumber: blockNumber,
            }),
          });

          if (!updateResponse.ok) {
          }
        } catch (updateError) {
          // Continue with success flow even if update fails
        }

        await handleTransactionSuccess(result.transactionHash, depositAmount);

        // Add a slight delay to make the loading state more visible
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        // Show user-friendly error message
        let errorMessage = "Transaction failed";
        if (error instanceof Error) {
          // Extract a readable message from the error
          const errorString = error.message;
          if (errorString.includes("user rejected transaction")) {
            errorMessage = "You rejected the transaction";
          } else if (errorString.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
          } else if (
            errorString.includes("network") ||
            errorString.includes("connect")
          ) {
            errorMessage = "Network connection issue";
          } else {
            // Generic error with first part of message
            errorMessage = errorString.split(".")[0];
          }
        }

        // Set the error message for the banner
        setDepositError(errorMessage);
        setTxProgressPercent(0);
        setSimulationStatus(null); // Clear simulation status on error
        // Reset submission state to allow retrying
        setIsSubmitting(false);
        isProcessingRef.current = false;

        // Store the failed deposit in our state
        if (pool?.protocol_pair_id) {
          const poolId = pool.protocol_pair_id;
          setCompletedDeposits((prev) => ({
            ...prev,
            [poolId]: {
              success: false,
              amount: depositAmount,
              txHash: "",
            },
          }));
        }

        // Only show error toast if the modal is still open
        if (!modalClosedDuringProcessingRef.current) {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      // Set the error message for the banner
      setDepositError("Failed to prepare transaction");
      setTxProgressPercent(0);
      setSimulationStatus(null); // Clear simulation status on error
      // Reset submission state to allow retrying
      setIsSubmitting(false);
      isProcessingRef.current = false;

      // Store the failed deposit in our state
      if (pool?.protocol_pair_id) {
        const poolId = pool.protocol_pair_id;
        setCompletedDeposits((prev) => ({
          ...prev,
          [poolId]: {
            success: false,
            amount: depositAmount,
            txHash: "",
          },
        }));
      }
    } finally {
      // Only reset submission state if not already reset in the catch blocks
      // and only if this specific modal is still open and matches the processing pool ID
      if (isSubmitting && pool?.protocol_pair_id === processingPoolId) {
        if (!showSuccessModal) {
          setIsSubmitting(false);
          isProcessingRef.current = false;
          setProcessingPoolId(null);
        }
      }
    }
  };

  // Check for completed deposits when pool changes
  useEffect(() => {
    if (pool?.protocol_pair_id && completedDeposits[pool.protocol_pair_id]) {
      // If this pool has a completed deposit, show the appropriate modal
      const depositData = completedDeposits[pool.protocol_pair_id];

      // Set the submitted amount for display
      submittedAmountRef.current = depositData.amount;

      if (depositData.success) {
        // Set transaction hash for the link
        setTxHash(depositData.txHash);
        // Show success modal
        setShowSuccessModal(true);
      } else {
        // For failed deposits, show an error toast
        toast.error("Previous Deposit Failed");

        // Clear the failed deposit status
        setCompletedDeposits((prev) => {
          const newState = { ...prev };
          delete newState[pool.protocol_pair_id as string];
          return newState;
        });
      }
    }
  }, [pool, completedDeposits, toast]);

  // If theme isn't loaded yet or no pool selected, return nothing
  if (!mounted || !pool) return null;

  // Calculate the initial angle for the radial progress bar (0-1 range)
  const initialAngle = sliderValue / 100;

  // Function to format error messages for display
  const formatErrorMessage = (errorMsg: string): string => {
    // If it's an ERC20 error, extract just the important part
    if (errorMsg.includes("ERC20:")) {
      // Get text between 'ERC20:' and the next period or end of string
      const match = errorMsg.match(/ERC20:\s*([^.]+)/);
      if (match && match[1]) {
        return `ERC20: ${match[1].trim()}`;
      }
    }
    // If it contains "UserOp failed", simplify it
    if (errorMsg.includes("UserOp failed")) {
      const match = errorMsg.match(/UserOp failed with reason:\s*([^']+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    // For general errors, limit to reasonable length
    if (errorMsg.length > 100) {
      return errorMsg.substring(0, 97) + "...";
    }

    return errorMsg;
  };

  return (
    <>
      {/* Main Deposit Modal */}
      {!showSuccessModal ? (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/70  backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden"
          // Allow closing by clicking outside even during processing
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <Card
            title={`Deposit to ${pool?.name} ${pool?.pair_or_vault_name}`}
            onClose={handleClose}
            className="max-h-[90vh] w-full max-w-md"
          >
            <div className="flex flex-col space-y-5 overflow-y-auto max-h-[calc(90vh-8rem)] pb-4">
              {/* Input and Circle Section */}
              <div>
                {/* Radial progress bar */}
                <div className="flex flex-col items-center mt-2">
                  <RadialProgressBar
                    initialAngle={initialAngle}
                    maxBalance={maxBalance}
                    onAngleChange={handleRadialProgressUpdate}
                    isLoadingBalance={localIsLoadingBalance}
                  />
                </div>
              </div>

              {/* Statistics */}
              <div
                className={`${
                  theme === "dark" ? "bg-[#0f0b22]/30" : "bg-[#070219]/5"
                } rounded-lg p-4`}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-black"
                    }
                  >
                    Estimated APY
                  </span>
                  {isLoadingApy ? (
                    <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-[#8266E6] dark:text-[#FFD659]">
                      {currentApy?.toFixed(3) || 0}%
                    </span>
                  )}
                </div>
                
                {/* Minimum Deposit for Tempest */}
                {minimumDeposit > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span
                      className={
                        theme === "dark" ? "text-yellow-300" : "text-orange-600"
                      }
                    >
                      ⚠️ Minimum Deposit
                    </span>
                    <span
                      className={`font-medium ${
                        theme === "dark" ? "text-yellow-300" : "text-orange-600"
                      }`}
                    >
                      ${minimumDeposit}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-black"
                    }
                  >
                    Estimated Yearly Yield
                  </span>
                  <span
                    className={theme === "dark" ? "text-white" : "text-black"}
                  >
                    ${(Math.floor(yearlyYield * 1000) / 1000).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-black"
                    }
                  >
                    Minimum Deposit
                  </span>
                  <span
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }
                  >
                    {isLoadingMinimumDeposits ? (
                      <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                    ) : minimumDeposits ? (
                      `$${getMinimumDepositAmount()}`
                    ) : (
                      <span className="text-red-500 text-xs">
                        Failed to load
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons - Fixed at the bottom */}
            <div className="mt-4 flex justify-center gap-3 pt-2 ">
              <button
                className={`w-[60%] py-3 rounded-lg relative mb-2 ${
                  // Only show as processing if this specific pool is being processed
                  isSubmitting && pool?.protocol_pair_id === processingPoolId
                    ? "bg-gray-300 text-gray-500"
                    : parseFloat(amount) > 0
                    ? "bg-[#8266E6] text-white hover:bg-[#3C229C]"
                    : "bg-gray-300 text-gray-500"
                }`}
                disabled={
                  parseFloat(amount) <= 0 ||
                  (minimumDeposit > 0 && parseFloat(amount) < minimumDeposit) ||
                  (isSubmitting && pool?.protocol_pair_id === processingPoolId)
                }
                onClick={() => {
                  // Ensure we capture the most recent amount calculation directly from the ref
                  const currentAmount =
                    lastCalculatedAmountRef.current || amount;

                  // Make sure the amount in the ref is immediately available for handleConfirmDeposit
                  handleConfirmDeposit();
                }}
              >
                {isSubmitting && pool?.protocol_pair_id === processingPoolId ? (
                  <>
                    <span className="opacity-0">Confirm Deposit</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-gray-500 border-t-gray-700 rounded-full animate-spin mr-2"></div>
                      <span className="text-gray-700">Processing...</span>
                    </div>
                  </>
                ) : (
                  "Confirm Deposit"
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
                      ? "Processing transaction..."
                      : "Transaction complete!")}
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
            {depositError && (
              <div
                className={`mt-4 rounded-lg p-3 ${
                  theme === "dark" ? "bg-red-900/40" : "bg-red-100"
                } relative`}
              >
                <div className="pr-6">
                  {" "}
                  {/* Add right padding for close button */}
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-red-100" : "text-red-800"
                    } break-words`}
                  >
                    <span className="font-bold">Error:</span>{" "}
                    {formatErrorMessage(depositError)}
                  </p>
                </div>
                <button
                  onClick={() => setDepositError(null)}
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
            title="Deposit Successful!"
            onClose={handleCloseAll}
            className="w-full max-w-md text-center"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-purple-500" />
              </div>

              <div className="mb-6">
                <p className="text-lg mb-1">You've deposited</p>
                <p className="text-3xl font-bold text-purple-500">
                  ${submittedAmountRef.current} USD
                </p>
                <p className="text-sm mt-2 opacity-80">
                  into {pool.pair_or_vault_name}
                </p>
              </div>

              <div
                className={`w-full ${
                  theme === "dark"
                    ? "bg-white/5 border-white/60"
                    : "bg-gray-100"
                } p-4 rounded-lg mb-6 border`}
              >
                <div className="flex justify-between mb-2">
                  <span className="opacity-70">Expected APY</span>
                  <span className="font-semibold text-green-500">
                    {currentApy?.toFixed(3) || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Estimated Yearly Yield</span>
                  <span className="font-semibold">
                    $
                    {(
                      Math.floor(submittedYearlyYieldRef.current * 1000) / 1000
                    ).toFixed(3)}
                  </span>
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
