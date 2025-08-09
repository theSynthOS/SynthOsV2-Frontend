"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowRight, Upload, X } from "lucide-react";
import { MoveUp, MoveDown, Send, Copy, Check, Users, Gift } from "lucide-react";
import WalletDeposit from "@/components/features/wallet-deposit";
import SendModal from "@/components/features/wallet-send";
import BuyModal from "@/components/features/wallet-buy";
import { usePrivy } from "@privy-io/react-auth";
import { useTheme } from "next-themes";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import {
  safeHaptic,
  copyHaptic,
  mediumHaptic,
  heavyHaptic,
  errorHaptic,
} from "@/lib/haptic-utils";
import HoldingCard from "@/components/ui/holding-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import Card from "@/components/ui/card";

type Holding = {
  protocolPairId: string;
  protocolName: string;
  pairName: string;
  currentAmount: number;
  initialAmount: number;
  pnl: number;
  apy: number;
  status: string;
  protocolLogo: string;
  risk: string;
};

export default function HoldingPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const controls = useAnimation();
  const [copied, setCopied] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  // Use Privy for wallet authentication
  const { user, authenticated, login } = usePrivy();
  const { displayAddress, smartWalletClient, isSmartWalletActive } =
    useSmartWallet();

  // Use display address from context
  const account =
    authenticated && displayAddress ? { address: displayAddress } : null;
  // Referral states
  const [referralCode, setReferralCode] = useState<string>("");
  const [userReferralCode, setUserReferralCode] = useState<string>("");
  const [referralBy, setReferralBy] = useState<string>("");
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);
  const [inputReferralCode, setInputReferralCode] = useState<string>("");
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const [referralAmount, setReferralAmount] = useState<number>(0);

  // View All modal state
  const [showViewAllModal, setShowViewAllModal] = useState(false);

  // Lock background scroll when View All modal is open
  useEffect(() => {
    if (showViewAllModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showViewAllModal]);

  // Set mounted to true on initial load to enable theme rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Display address is now managed by the context

  // TODO: Function to fetch holdings data
  const fetchHoldings = async () => {
    if (!account?.address) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/holdings?address=${account.address}`); //@note this should be accounts/holdings
      const data = await res.json();
      setHoldings(Array.isArray(data) ? data : []);
    } catch (error) {
      setHoldings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch holdings data on mount and address change
  useEffect(() => {
    fetchHoldings();
  }, [account?.address]);

  // Listen for holdings refresh events
  useEffect(() => {
    const handleRefreshHoldings = () => {
      fetchHoldings();
    };

    window.addEventListener("refreshHoldings", handleRefreshHoldings);

    return () => {
      window.removeEventListener("refreshHoldings", handleRefreshHoldings);
    };
  }, []);

  useEffect(() => {
    if (!account?.address) return;
    setIsLoadingReferral(true);
    fetch(`/api/referral?address=${account.address}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUserReferralCode(data.user.referralCode || "");
          setReferralBy(data.user.referralBy || "");
        }
      })
      .catch(() => {
        // Error handling
      })
      .finally(() => {
        setIsLoadingReferral(false);
      });
    // Fetch referral amount
    fetch(`/api/referral-amount?address=${account.address}`)
      .then((res) => res.json())
      .then((data) => setReferralAmount(data.referralAmount || 0))
      .catch(() => {
        // Error handling
      });
  }, [account?.address]);

  useEffect(() => {
    const handleReferralCode = async () => {
      if (!account?.address) return;
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get("ref");

      if (referralCode) {
        try {
          const response = await fetch("/api/referral", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              address: account.address,
              referralCode: referralCode,
            }),
          });

          const data = await response.json();

          if (data.success) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("ref");
            window.history.replaceState({}, "", newUrl.toString());

            const refreshResponse = await fetch(
              `/api/referral?address=${account.address}`
            );
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.user) {
              setReferralBy(refreshData.user.referralBy || "");
            }
          }
        } catch (error) {
          // Error handling
        }
      } else {
        try {
          const response = await fetch(
            `/api/referral?address=${account.address}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();

          if (data.success && data.user) {
            setUserReferralCode(data.user.referralCode || "");
            setReferralBy(data.user.referralBy || "");
          }
        } catch (error) {
          // Error handling
        }
      }
    };

    handleReferralCode();
  }, [account?.address]);
  // Filter out holdings with extremely small balances (1e-10 and smaller) and zero initial amounts

  const filteredHoldings = holdings.filter((h) => {
    // Exclude holdings where currentAmount is extremely small (scientific notation -10 and below)
    const hasVisibleCurrentAmount = Math.abs(h.currentAmount) >= 1e-5;

    // Exclude holdings where initialAmount is 0
    const hasValidInitialAmount = Math.abs(h.initialAmount) >= 1e-5;

    return hasValidInitialAmount && hasVisibleCurrentAmount;
  });

  // Calculate total holding and pnl using filtered holdings
  const totalHolding = filteredHoldings.reduce(
    (sum, h) => sum + (h.currentAmount || 0),
    0
  );
  const totalPnl = filteredHoldings.reduce((sum, h) => sum + (h.pnl || 0), 0);

  // Format PnL with intelligent decimal places (for total PnL display)
  const formatPnl = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue === 0) return "0.00";
    if (absValue >= 0.01) return absValue.toFixed(2);
    if (absValue >= 0.001) return absValue.toFixed(3);
    if (absValue >= 0.0001) return absValue.toFixed(4);
    if (absValue >= 0.00001) return absValue.toFixed(5);
    if (absValue >= 0.000001) return absValue.toFixed(6);
    // For very small values, use scientific notation
    return absValue.toExponential(2);
  };

  // Fix floating-point precision issues - use a more robust approach
  const normalizedTotalPnl = parseFloat(totalPnl.toFixed(10));

  // Format PnL - use normalized value for both color and sign
  const pnlColor =
    normalizedTotalPnl > 0
      ? "text-green-500"
      : normalizedTotalPnl < 0
      ? "text-red-500"
      : "text-gray-500";
  const pnlSign =
    normalizedTotalPnl > 0 ? "+" : normalizedTotalPnl < 0 ? "-" : "";

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 6
    )}`;
  };

  // Handle copy address to clipboard
  const handleCopyAddress = () => {
    if (displayAddress) {
      navigator.clipboard
        .writeText(displayAddress)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          // Copy action haptic feedback
          safeHaptic("copy");
          toast("Wallet address copied to clipboard");
        })
        .catch((err) => {
          // Error handling
        });
    }
  };

  const handleApplyReferralCode = async () => {
    console.log("handleApplyReferralCode called");
    console.log("inputReferralCode:", inputReferralCode);
    console.log("account:", account);
    console.log("displayAddress:", displayAddress);
    console.log("authenticated:", authenticated);

    if (!inputReferralCode.trim()) {
      console.log("No referral code entered");
      errorHaptic();
      return;
    }
    if (!account?.address) {
      console.log("No account address available");
      toast.error("Please connect your wallet", {
        description: "You need to connect your wallet to use referral codes"
      });
      return;
    }
    heavyHaptic();
    setIsApplyingReferral(true);
    try {
      console.log("Making API request with:", {
        address: account.address,
        referralCode: inputReferralCode.trim(),
      });

      const response = await fetch("/api/referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: account.address,
          referralCode: inputReferralCode.trim(),
        }),
      });
      const data = await response.json();
      console.log("API response:", data);

      if (data.success) {
        toast.success("Referral code applied successfully!", {
          description: "You can now earn rewards through referrals"
        });
        setInputReferralCode("");
        const refreshResponse = await fetch(
          `/api/referral?address=${account.address}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshData.success && refreshData.user) {
          setReferralBy(refreshData.user.referralBy || "");
        }
      } else {
        if (data.error === "You cannot refer yourself.") {
          toast.error("You cannot enter your own referral code", {
            description: "Please use someone else's referral code"
          });
        } else {
          toast.error(data.error || "Failed to apply referral code", {
            description: "Please try again or Invalid referral code"
          });
        }
      }
    } catch (error) {
      console.error("Error in handleApplyReferralCode:", error);
      toast.error("Failed to apply referral code", {
        description: "Please try again or contact support if the issue persists"
      });
    } finally {
      setIsApplyingReferral(false);
    }
  };

  const handleCopyReferralCode = () => {
    if (userReferralCode) {
      navigator.clipboard
        .writeText(userReferralCode)
        .then(() => {
          setReferralCopied(true);
          setTimeout(() => setReferralCopied(false), 2000);
          safeHaptic("copy");
          toast.info("Your referral code has been copied to clipboard", {
            description: "Share it with friends to earn rewards"
          });
        })
        .catch((err) => {
          // Error handling
        });
    }
  };

  // const handleDragEnd = (
  //   event: MouseEvent | TouchEvent | PointerEvent,
  //   info: PanInfo
  // ) => {
  //   const threshold = 100; // minimum distance to trigger navigation
  //   if (info.offset.x > threshold) {
  //     router.replace("/home");
  //   } else {
  //     controls.start({ x: 0 });
  //   }
  // };

  // Reset animation state when component mounts or updates
  useEffect(() => {
    controls.set({ x: 0 });
  }, [controls]);

  // If theme isn't loaded yet, render nothing to avoid flash
  if (!mounted) return null;

  return (
    <>
      <motion.div
        // {...(isMobile
        //   ? {
        //       drag: "x",
        //       dragConstraints: { left: 0, right: 0 },
        //       dragElastic: 0.2,
        //       onDragEnd: handleDragEnd,
        //       whileDrag: { cursor: "grabbing" },
        //     }
        //   : {})}
        animate={controls}
        initial={{ x: 0 }}
        className={`flex flex-col bg-transparent ${
          theme === "dark" ? "text-white" : "text-black"
        } p-4 xl:p-0`}
      >
        {/* Section 1: User Profile */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-[10px] lg:mt-0"
        >
          <div
            className={`${
              theme === "dark" ? "bg-[#1E1E1E]/80" : "bg-[#FFFFFF]/65 shadow-sm"
            } rounded-2xl p-5 mb-3 `}
          >
            {/* Total holding value */}
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col items-start">
                <span
                  className={`text-sm xl:text-lg tracking-widest font-medium ${
                    theme === "dark" ? "text-[#727272]" : "text-[#A1A1A1]"
                  }`}
                >
                  Total Position Value
                </span>
                <div className="my-2">
                  {isLoading && account?.address ? (
                    <div className="flex items-center space-x-2">
                      <Skeleton
                        className={`h-8 xl:h-12 w-32 xl:w-48 ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                        }`}
                      />
                      <Skeleton
                        className={`h-6 xl:h-8 w-16 ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                        }`}
                      />
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-3xl font-bold xl:font-medium xl:text-5xl ${
                          theme === "dark"
                            ? "text-white xl:text-[#FFCA59] xl:drop-shadow-[0_0_12px_rgba(255,202,89,0.5)]"
                            : "text-black"
                        }`}
                        style={{
                          fontFamily: "var(--font-tt-travels), sans-serif",
                        }}
                      >
                        ${totalHolding.toFixed(2)}
                      </span>
                      {/* pnl */}
                      <span
                        className={`text-sm xl:text-lg tracking-widest font-medium px-2 ${pnlColor}`}
                      >
                        {pnlSign}${formatPnl(normalizedTotalPnl)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start">
              {/* Wallet Address */}

              <div
                className={`text-sm ${
                  theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                } flex items-center`}
              >
                <span>
                  {account?.address && formatAddress(account.address)}
                </span>
                {!account?.address && (
                  <button
                    onClick={login}
                    className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      theme === "dark"
                        ? "bg-[#8266E6] hover:bg-[#7255d5] text-white"
                        : "bg-[#8266E6] hover:bg-[#7255d5] text-white"
                    }`}
                  >
                    Connect Wallet
                  </button>
                )}

                {account?.address && (
                  <button
                    onClick={handleCopyAddress}
                    className={`ml-2 p-1 rounded-full transition-colors ${
                      theme === "dark"
                        ? "hover:bg-gray-700/70"
                        : "hover:bg-gray-100"
                    }`}
                    aria-label="Copy address to clipboard"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`${
              theme === "dark" ? "bg-[#1E1E1E]/80" : "bg-[#FFFFFF]/65 shadow-sm"
            } rounded-2xl p-5 mb-3`}
          >
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full text-sm xl:text-lg mb-4">
                <span
                  className={`tracking-widest font-medium ${
                    theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                  }`}
                >
                  YOUR POSITIONS
                </span>

                <div
                  className={`flex items-center gap-1 ${
                    theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                  } cursor-pointer hover:underline hover:opacity-80 transition-opacity`}
                  onClick={() => {
                    mediumHaptic();
                    setShowViewAllModal(true);
                  }}
                >
                  <span className="tracking-widest font-medium">View All</span>
                  <ArrowRight size={16} />
                </div>
              </div>
              {isLoading ? (
                <div className="w-full space-y-4">
                  {/* Skeleton for HoldingCard */}
                  {[...Array(1)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-full max-w-md mx-auto rounded-2xl overflow-hidden border ${
                        theme === "dark"
                          ? "bg-[#0B0424] border-white/30"
                          : "bg-[#F5F2FF] border-[#CECECE]"
                      } shadow-md relative`}
                      style={{
                        boxShadow:
                          theme === "dark"
                            ? "inset 0 0 20px rgba(143, 99, 233, 0.45)"
                            : "inset 0 0 20px rgba(143, 99, 233, 0.2)",
                      }}
                    >
                      <div className="p-4 flex flex-col relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <Skeleton
                              className={`w-10 h-10 rounded-full ${
                                theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                              }`}
                            />
                            <div>
                              <Skeleton
                                className={`h-5 w-16 mb-1 ${
                                  theme === "dark"
                                    ? "bg-gray-700"
                                    : "bg-gray-300"
                                }`}
                              />
                              <Skeleton
                                className={`h-3 w-20 ${
                                  theme === "dark"
                                    ? "bg-gray-700"
                                    : "bg-gray-300"
                                }`}
                              />
                            </div>
                          </div>
                          <Skeleton
                            className={`h-8 w-16 rounded-full ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <div className="text-center mb-4">
                          <Skeleton
                            className={`h-9 w-24 mx-auto ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                      <Skeleton
                        className={`w-full h-12 rounded-none ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              ) : filteredHoldings.length === 0 ? (
                <div
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No Positions Available
                </div>
              ) : (
                filteredHoldings.slice(0, 1).map((h, idx) => {
                  return (
                    <HoldingCard
                      key={idx}
                      symbol={h.pairName}
                      name={h.protocolName}
                      amount={h.initialAmount.toString()}
                      apy={h.apy.toString()}
                      protocolLogo={h.protocolLogo}
                      pnl={h.pnl}
                      currentAmount={h.initialAmount.toString()}
                      pool={{
                        name: h.protocolName,
                        apy: h.apy.toFixed(3),
                        risk: h.risk, // Default risk level
                        pair_or_vault_name: h.pairName,
                        protocol_id: h.protocolName
                          .toLowerCase()
                          .replace(/\s+/g, "-"),
                        protocol_pair_id: h.protocolPairId
                          .toLowerCase()
                          .replace(/\s+/g, "-"),
                      }}
                      balance={h.currentAmount.toString()}
                      address={displayAddress || undefined}
                      refreshBalance={() => {
                        // TODO: Refetch holdings data
                        if (account?.address) {
                          setIsLoading(true);
                          fetch(`/api/holdings?address=${account.address}`)
                            .then((res) => res.json())
                            .then((data) => {
                              setHoldings(Array.isArray(data) ? data : []);
                            })
                            .catch(() => {
                              setHoldings([]);
                            })
                            .finally(() => setIsLoading(false));
                        }
                      }}
                      onClick={() => {}}
                    />
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Section 3: Referral */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`${
              theme === "dark" ? "bg-[#1E1E1E]/80" : "bg-[#FFFFFF]/65 shadow-sm"
            } rounded-2xl p-5 mb-3`}
          >
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full text-sm xl:text-lg mb-4">
                <span
                  className={`tracking-widest font-medium ${
                    theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                  }`}
                >
                  REFERRAL PROGRAM
                </span>
                <Gift
                  className={`h-5 w-5 ${
                    theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                  }`}
                />
              </div>

              {!account?.address ? (
                <div className="w-full space-y-4">
                  <div className="text-center py-3">
                    <span
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Please connect wallet to view referral program
                    </span>
                  </div>
                </div>
              ) : isLoadingReferral ? (
                <div className="w-full space-y-4">
                  {/* Skeleton for Your Referral Code */}
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                      }`}
                    >
                      Your Referral Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="flex-1 h-12 bg-gray-300 dark:bg-gray-700" />
                      <Skeleton className="w-12 h-12 bg-gray-300 dark:bg-gray-700" />
                    </div>
                  </div>

                  {/* Skeleton for Apply Referral Code */}
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                      }`}
                    >
                      Referred By
                    </label>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="flex-1 h-12 bg-gray-300 dark:bg-gray-700" />
                      <Skeleton className="w-12 h-12 bg-gray-300 dark:bg-gray-700" />
                    </div>
                  </div>

                  {/* Skeleton for info text */}
                  <div className="text-xs text-center">
                    Share your referral code with friends to earn points when
                    they deposited!
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  {/* Your Referral Code */}
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                      }`}
                    >
                      Your Referral Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`flex-1 p-3 rounded-lg border ${
                          theme === "dark"
                            ? "bg-[#2A2A2A] border-gray-700 text-white"
                            : "bg-white border-gray-200 text-black"
                        } font-mono text-sm`}
                      >
                        {userReferralCode || (
                          <Skeleton className="w-20 h-8 bg-gray-300 dark:bg-gray-700" />
                        )}
                      </div>
                      <button
                        onClick={handleCopyReferralCode}
                        disabled={!userReferralCode}
                        className={`p-3 rounded-lg border transition-colors ${
                          theme === "dark"
                            ? "border-gray-700 hover:bg-gray-700/70"
                            : "border-gray-200 hover:bg-gray-100"
                        } ${
                          !userReferralCode
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        aria-label="Copy referral code"
                      >
                        {referralCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Referred By */}
                  {referralBy && (
                    <div className="space-y-2">
                      <label
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                        }`}
                      >
                        Referred By
                      </label>
                      <div
                        className={`p-3 rounded-lg border ${
                          theme === "dark"
                            ? "bg-[#2A2A2A] border-gray-700 text-white"
                            : "bg-white border-gray-200 text-black"
                        } font-mono text-sm`}
                      >
                        {referralBy}
                      </div>
                    </div>
                  )}

                  {/* Apply Referral Code */}
                  {!referralBy && (
                    <div className="space-y-2">
                      <label
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                        }`}
                      >
                        Apply Referral Code
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={inputReferralCode}
                          onChange={(e) => setInputReferralCode(e.target.value)}
                          placeholder="Enter referral code"
                          className={`flex-1 p-3 rounded-lg border ${
                            theme === "dark"
                              ? "bg-[#2A2A2A] border-gray-700 text-white placeholder-gray-400"
                              : "bg-white border-gray-200 text-black placeholder-gray-500"
                          } font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#8266E6]`}
                          maxLength={8}
                        />
                        <button
                          onClick={handleApplyReferralCode}
                          disabled={
                            !inputReferralCode.trim() || isApplyingReferral
                          }
                          className={`px-4 py-3 rounded-lg border transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700/70"
                              : "border-gray-200 hover:bg-gray-100"
                          } ${
                            !inputReferralCode.trim() || isApplyingReferral
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {isApplyingReferral ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#8266E6] rounded-full animate-spin" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Referral Amount */}
                  <div className="mt-3 flex justify-center">
                    <div className="rounded-lg bg-purple-50 dark:bg-[#2a1a4d] px-4 py-3 text-purple-800 dark:text-purple-200 text-sm font-semibold shadow-sm border border-purple-200 dark:border-[#3a2566] min-w-[220px] text-center">
                      You have referred <b>{referralAmount}</b> people.
                    </div>
                  </div>

                  {/* Referral Info */}
                  <div
                    className={`text-xs ${
                      theme === "dark" ? "text-[#727272]" : "text-[#A1A1A1]"
                    } text-center`}
                  >
                    Share your referral code with friends to earn points when
                    they deposited!
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* View All Modal */}
        {showViewAllModal && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                mediumHaptic();
                setShowViewAllModal(false);
              }
            }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Modal Content */}
            <div className="relative z-[999] w-full max-w-4xl max-h-[90vh]">
              <Card
                title="All Positions"
                onClose={() => {
                  mediumHaptic();
                  setShowViewAllModal(false);
                }}
                className="max-h-[90vh] overflow-hidden"
              >
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-1 scrollbar-hide">
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4">
                      {[...Array(6)].map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-full rounded-2xl overflow-hidden border ${
                            theme === "dark"
                              ? "bg-[#0B0424] border-gray-700"
                              : "bg-[#F5F2FF] border-gray-200"
                          } shadow-md relative`}
                          style={{
                            boxShadow:
                              theme === "dark"
                                ? "inset 0 0 20px rgba(143, 99, 233, 0.45)"
                                : "inset 0 0 20px rgba(143, 99, 233, 0.2)",
                          }}
                        >
                          <div className="p-4 flex flex-col relative z-10">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                <Skeleton
                                  className={`w-10 h-10 rounded-full ${
                                    theme === "dark"
                                      ? "bg-gray-700"
                                      : "bg-gray-300"
                                  }`}
                                />
                                <div>
                                  <Skeleton
                                    className={`h-5 w-16 mb-1 ${
                                      theme === "dark"
                                        ? "bg-gray-700"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <Skeleton
                                    className={`h-3 w-20 ${
                                      theme === "dark"
                                        ? "bg-gray-700"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                </div>
                              </div>
                              <Skeleton
                                className={`h-8 w-16 rounded-full ${
                                  theme === "dark"
                                    ? "bg-gray-700"
                                    : "bg-gray-300"
                                }`}
                              />
                            </div>
                            <div className="text-center mb-4">
                              <Skeleton
                                className={`h-9 w-24 mx-auto ${
                                  theme === "dark"
                                    ? "bg-gray-700"
                                    : "bg-gray-300"
                                }`}
                              />
                            </div>
                          </div>
                          <Skeleton
                            className={`w-full h-12 rounded-none ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : filteredHoldings.length === 0 ? (
                    <div className="text-center py-12">
                      <div
                        className={`text-lg font-medium mb-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        No Positions Available
                      </div>
                      <div
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Start investing to see your positions here
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredHoldings.map((h, idx) => (
                        <HoldingCard
                          key={idx}
                          symbol={h.pairName}
                          name={h.protocolName}
                          amount={h.initialAmount.toString()}
                          apy={h.apy.toString()}
                          protocolLogo={h.protocolLogo}
                          pnl={h.pnl}
                          currentAmount={h.initialAmount.toString()}
                          pool={{
                            name: h.protocolName,
                            apy: h.apy.toFixed(3),
                            risk: h.risk,
                            pair_or_vault_name: h.pairName,
                            protocol_id: h.protocolName
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                            protocol_pair_id: h.protocolPairId
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                          }}
                          balance={h.currentAmount.toString()}
                          address={displayAddress || undefined}
                          refreshBalance={() => {
                            // TODO: Refetch holdings data
                            if (account?.address) {
                              setIsLoading(true);
                              fetch(`/api/holdings?address=${account.address}`)
                                .then((res) => res.json())
                                .then((data) => {
                                  setHoldings(Array.isArray(data) ? data : []);
                                })
                                .catch(() => {
                                  setHoldings([]);
                                })
                                .finally(() => setIsLoading(false));
                            }
                          }}
                          onClick={() => {
                            mediumHaptic();
                            setShowViewAllModal(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div
                  className={`mt-6 pt-4 border-t ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Positions: {filteredHoldings.length}
                    </div>
                    <button
                      onClick={() => {
                        mediumHaptic();
                        setShowViewAllModal(false);
                      }}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        theme === "dark"
                          ? "bg-[#8266E6] hover:bg-[#3C229C] text-white"
                          : "bg-[#8266E6] hover:bg-[#3C229C] text-white"
                      }`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
