"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import { RadialProgressBar } from "@/components/circular-progress-bar/Radial-Progress-Bar";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { client } from "@/client";
import { scrollSepolia } from "@/client";
import {
  prepareTransaction,
  sendAndConfirmTransaction,
  sendBatchTransaction,
} from "thirdweb";
import { useAuth } from "@/contexts/AuthContext";

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
  const { toast } = useToast();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const successModalRef = useRef<HTMLDivElement>(null);
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const [depositError, setDepositError] = useState<string | null>(null);
  const [txProgressPercent, setTxProgressPercent] = useState(0);
  const refreshTimersRef = useRef<NodeJS.Timeout[]>([]);
  const [localIsLoadingBalance, setLocalIsLoadingBalance] = useState(false);
  const { email } = useAuth();

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
        } catch (error) {
          console.error("Error fetching APY:", error);
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
        const newAmount = ((currentPercentage / 100) * maxBalance).toFixed(2);
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
      toast({
        title: "Transaction in progress",
        description: "Your deposit is still processing in the background.",
        duration: 5000,
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
      const newBalance = data.usdBalance || "0.00";

      // Update the local maxBalance state
      setMaxBalance(Number(newBalance));

      // Also call the parent's refreshBalance if available
      if (refreshBalance) {
        refreshBalance();
      }

      return newBalance;
    } catch (error) {
      console.error("Error fetching balance directly:", error);
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
    } catch (error) {
      console.error("Error refreshing balance in deposit modal:", error);

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

    if (pool) {
      // Save current body styles and position
      const scrollY = window.scrollY;
      const originalStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        height: document.body.style.height,
      };

      // Prevent background scrolling and interactions
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.height = "100%";

      return () => {
        // Restore original body styles
        document.body.style.overflow = originalStyle.overflow;
        document.body.style.position = originalStyle.position;
        document.body.style.top = originalStyle.top;
        document.body.style.width = originalStyle.width;
        document.body.style.height = originalStyle.height;

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [pool]);

  // Prevent touchmove events from propagating to body
  useEffect(() => {
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;

      // Check if we're inside the modal content
      if (
        (modalRef.current && modalRef.current.contains(target)) ||
        (successModalRef.current && successModalRef.current.contains(target))
      ) {
        // Allow scrolling within scrollable elements inside the modal
        const isScrollable = (el: HTMLElement) => {
          // Check if the element has a scrollbar
          const hasScrollableContent = el.scrollHeight > el.clientHeight;
          // Get the computed overflow-y style
          const overflowYStyle = window.getComputedStyle(el).overflowY;
          // Check if overflow is set to something scrollable
          const isOverflowScrollable = ["scroll", "auto"].includes(
            overflowYStyle
          );

          return hasScrollableContent && isOverflowScrollable;
        };

        // Find if we're inside a scrollable container
        let scrollableParent = target;
        let currentModalRef = modalRef.current?.contains(target)
          ? modalRef.current
          : successModalRef.current;

        while (
          scrollableParent &&
          currentModalRef &&
          currentModalRef.contains(scrollableParent)
        ) {
          if (isScrollable(scrollableParent)) {
            // If we're at the top or bottom edge of the scrollable container, prevent default behavior
            const atTop = scrollableParent.scrollTop <= 0;
            const atBottom =
              scrollableParent.scrollHeight - scrollableParent.scrollTop <=
              scrollableParent.clientHeight + 1;

            // Check scroll direction using touch position
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              const touchY = touch.clientY;

              // Store the last touch position
              const lastTouchY =
                scrollableParent.getAttribute("data-last-touch-y");
              scrollableParent.setAttribute(
                "data-last-touch-y",
                touchY.toString()
              );

              if (lastTouchY) {
                const touchDelta = touchY - parseFloat(lastTouchY);
                const scrollingUp = touchDelta > 0;
                const scrollingDown = touchDelta < 0;

                // Only prevent default if trying to scroll past the edges
                if ((atTop && scrollingUp) || (atBottom && scrollingDown)) {
                  e.preventDefault();
                }

                // Allow scrolling within the container
                return;
              }
            }
            return;
          }
          scrollableParent = scrollableParent.parentElement as HTMLElement;
        }
        // If we're not in a scrollable container within the modal, prevent default
        e.preventDefault();
      }
    };
    // Add the touchmove listener
    document.addEventListener("touchmove", preventTouchMove, {
      passive: false,
    });
    return () => {
      // Remove the touchmove listener
      document.removeEventListener("touchmove", preventTouchMove);
    };
  }, []);

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
    const calculatedAmount = ((validPercentage / 100) * maxBalance).toFixed(2);

    // Store in ref immediately (not affected by React's async state updates)
    lastCalculatedAmountRef.current = calculatedAmount;

    // Update the amount state - ensure it's a string with at least 2 decimal places
    setAmount(calculatedAmount);
  };

  // Calculate estimated yearly yield using the fetched APY
  const yearlyYield = (Number.parseFloat(amount) * (currentApy || 0)) / 100;

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
        toast({
          variant: "success",
          title: "Deposit Successful",
          description: `$${amount} deposited into ${pool?.name}`,
        });
      }

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Add 25 points for deposit
      fetch("/api/points/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, address }),
      })
        .then((res) => res.json())
        .then((data) => {
          // Fetch updated points
          fetch(
            `/api/points?${
              email
                ? `email=${encodeURIComponent(email)}`
                : `address=${encodeURIComponent(address ?? "")}`
            }`
          )
            .then((res) => res.json())

        })
        .catch((err) => {
          console.error("/api/points/deposit error:", err);
        });

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
          console.error("Failed to save transaction:", data.message);
        } else {
        }
      } catch (error) {
        console.error("Error saving transaction:", error);
      }
    } catch (error) {
      console.error("Error handling transaction success:", error);
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

    // Check if the amount is valid
    if (parseFloat(depositAmount) <= 0) {
  
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
      });
      return;
    }

    // Set processing flag to prevent RadialProgressBar updates
    isProcessingRef.current = true;

    // Start the loading state and track which pool is being processed
    setIsSubmitting(true);
    if (pool?.protocol_pair_id) {
      setProcessingPoolId(pool.protocol_pair_id);
    }
   



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
          protocol_id: pool?.protocol_id,
          protocol_pair_id: pool?.protocol_pair_id,
          amount: depositAmount,
        }),
      });

      // Update progress
      setTxProgressPercent(30);

      const responseData = await response.json();
    

      // Update progress
      setTxProgressPercent(50);

      // Execute the deposit payload
      try {
        if (!wallet || !account) {
          throw new Error("Wallet not connected");
        }

        // Prepare the transaction using the calldata from the API
        // Update progress
        setTxProgressPercent(60);

        const approvalTx = prepareTransaction({
          to: responseData[0].to,
          data: responseData[0].data,
          value: responseData[0].value
            ? BigInt(responseData[0].value)
            : BigInt(0),
          chain: scrollSepolia,
          client: client,
        });

        const depositIntoVaultTx = prepareTransaction({
          to: responseData[1].to,
          data: responseData[1].data,
          chain: scrollSepolia,
          client: client,
          // Ensure value is always a valid BigInt by defaulting to 0 if it's undefined
          value: responseData[1].value
            ? BigInt(responseData[1].value)
            : BigInt(0),
        });

        // Update progress
        setTxProgressPercent(75);

        // Send the transaction and wait for confirmation
        const result = await sendBatchTransaction({
          transactions: [approvalTx, depositIntoVaultTx],
          account,
        });

        // Update progress to complete
        setTxProgressPercent(100);

     
        await handleTransactionSuccess(result.transactionHash, depositAmount);

        // Add a slight delay to make the loading state more visible
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error("Deposit execution error:", error);

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
          toast({
            variant: "destructive",
            title: "Deposit Failed",
            description: errorMessage,
          });
        }
      }
    } catch (error) {
      console.error("Deposit API error:", error);

      // Set the error message for the banner
      setDepositError("Failed to prepare transaction");
      setTxProgressPercent(0);
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
        toast({
          variant: "destructive",
          title: "Previous Deposit Failed",
          description:
            "Your last deposit attempt for this pool failed. Please try again.",
        });

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
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-hidden"
          // Allow closing by clicking outside even during processing
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            ref={modalRef}
            className={`${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            } 
              rounded-lg w-full max-w-md p-4 overflow-hidden max-h-[90vh] relative isolate`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4">
              Deposit to {pool.pair_or_vault_name}
            </h3>

            <div
              className="flex flex-col space-y-5 overflow-y-auto max-h-[calc(90vh-8rem)] pb-4 scrollbar-hide"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Input and Circle Section */}
              <div>
                {/* Radial progress bar */}
                <div className="flex flex-col items-center">
                  <RadialProgressBar
                    initialAngle={initialAngle}
                    maxBalance={maxBalance}
                    onAngleChange={handleRadialProgressUpdate}
                  />
                </div>

                <div
                  className={`text-right text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  } mt-1 w-full`}
                >
                  Balance:{" "}
                  {localIsLoadingBalance ? (
                    <span className="inline-flex items-center">
                      <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                    </span>
                  ) : (
                    `${maxBalance.toFixed(2)} USDC`
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div
                className={`${
                  theme === "dark" ? "bg-[#0f0b22]/30" : "bg-gray-100/50"
                } rounded-lg p-4`}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    Estimated APY
                  </span>
                  {isLoadingApy ? (
                    <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-green-400">
                      {currentApy?.toFixed(3) || 0}%
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    Estimated Yearly Yield
                  </span>
                  <span
                    className={theme === "dark" ? "text-white" : "text-black"}
                  >
                    ${yearlyYield.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons - Fixed at the bottom */}
            <div className="mt-4 flex gap-3 pt-2 ">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-200 text-black font-semibold py-3 rounded-lg"
              >
                Cancel
              </button>
              <button
                className={`flex-1 font-semibold py-3 rounded-lg relative ${
                  // Only show as processing if this specific pool is being processed
                  isSubmitting && pool?.protocol_pair_id === processingPoolId
                    ? "bg-gray-300 text-gray-500"
                    : parseFloat(amount) > 0
                    ? "bg-purple-400 text-black hover:bg-purple-500"
                    : "bg-gray-300 text-gray-500"
                }`}
                disabled={
                  parseFloat(amount) <= 0 ||
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
                  {txProgressPercent < 100
                    ? "Processing transaction..."
                    : "Transaction complete!"}
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
          </div>
        </div>
      ) : (
        /* Success Modal */
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && handleCloseAll()}
        >
          <div
            ref={successModalRef}
            className={`${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            } 
              rounded-lg w-full max-w-md p-6 text-center`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              <h3 className="text-2xl font-bold mb-2">Deposit Successful!</h3>

              <div className="mb-6">
                <p className="text-lg mb-1">You've deposited</p>
                <p className="text-3xl font-bold text-purple-500">
                  ${submittedAmountRef.current} USDC
                </p>
                <p className="text-sm mt-2 opacity-80">
                  into {pool.pair_or_vault_name}
                </p>
              </div>

              <div
                className={`w-full ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                } p-4 rounded-lg mb-6`}
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
                    ${submittedYearlyYieldRef.current.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Transaction Link */}
              {txHash && (
                <a
                  href={`https://sepolia.scrollscan.dev/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center w-full ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  } py-3 px-4 rounded-lg mb-4 transition-colors`}
                >
                  <span className="mr-2">View Transaction</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={handleCloseAll}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
