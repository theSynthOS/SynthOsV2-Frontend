"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Info,
  Trophy,
  Users,
  Gift,
  Copy,
  Check,
  ExternalLink,
  Twitter,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  mediumHaptic,
  safeHaptic,
  errorHaptic,
  heavyHaptic,
} from "@/lib/haptic-utils";
import { toast } from "sonner";

export default function PointsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { authenticated } = usePrivy();
  const { displayAddress } = useSmartWallet();
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

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
  const [referralCopied, setReferralCopied] = useState(false);

  // One-time mission states
  const [xVerified, setXVerified] = useState<boolean>(false);
  const [telegramVerified, setTelegramVerified] = useState<boolean>(false);
  const [isVerifyingX, setIsVerifyingX] = useState<boolean>(false);
  const [isVerifyingTelegram, setIsVerifyingTelegram] = useState<boolean>(false);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!authenticated || !account?.address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch points data from API
        const response = await fetch(`/api/points?address=${account.address}`);
        const data = await response.json();

        if (data.success && data.data) {
          // Calculate total points from all sources
          const total =
            (data.data.pointsReferral || 0) +
            (data.data.pointsX || 0) +
            (data.data.pointsTG || 0);
          setTotalPoints(total);
        } else {
          setTotalPoints(0);
        }
      } catch (error) {
        console.error("Error fetching points:", error);
        setTotalPoints(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoints();
  }, [authenticated, account?.address]);

  // Fetch referral data
  useEffect(() => {
    if (!account?.address) return;
    setIsLoadingReferral(true);

    // Fetch points data which includes referral information
    fetch(`/api/points?address=${account.address}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setUserReferralCode(data.data.referralCode || "");
          setReferralBy(data.data.referralBy || "");
        }
      })
      .catch(() => {
        // Error handling
      });

    // Fetch referral count
    fetch(`/api/points?address=${account.address}&countReferrals=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReferralAmount(data.referralCount || 0);
        }
      })
      .catch(() => {
        // Error handling
      })
      .finally(() => {
        setIsLoadingReferral(false);
      });
  }, [account?.address]);

  // Handle referral code from URL
  useEffect(() => {
    const handleReferralCode = async () => {
      if (!account?.address) return;
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get("ref");

      if (referralCode) {
        try {
          const response = await fetch("/api/points", {
            method: "PUT",
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

            // Refresh the referral data
            const refreshResponse = await fetch(
              `/api/points?address=${account.address}`
            );
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.data) {
              setUserReferralCode(refreshData.data.referralCode || "");
              setReferralBy(refreshData.data.referralBy || "");
            }

            // Refresh referral count
            const countResponse = await fetch(
              `/api/points?address=${account.address}&countReferrals=true`
            );
            const countData = await countResponse.json();
            if (countData.success) {
              setReferralAmount(countData.referralCount || 0);
            }
          } else {
            // Show error toast for URL referral code issues
            if (data.error === "You cannot refer yourself") {
              toast.error("Invalid referral code in URL", {
                description: "You cannot refer yourself",
              });
            } else if (data.error === "Invalid referral code") {
              toast.error("Invalid referral code in URL", {
                description: "The referral code in the URL is not valid",
              });
            } else if (
              data.error ===
              "Referral code already applied and cannot be changed"
            ) {
              toast.error("Referral code already applied", {
                description: "You already have a referral code applied",
              });
            }
          }
        } catch (error) {
          console.error("Error applying URL referral code:", error);
        }
      } else {
        try {
          const response = await fetch(
            `/api/points?address=${account.address}`
          );

          const data = await response.json();

          if (data.success && data.data) {
            setUserReferralCode(data.data.referralCode || "");
            setReferralBy(data.data.referralBy || "");
          }
        } catch (error) {
          // Error handling
        }
      }
    };

    handleReferralCode();
  }, [account?.address]);

  // Clear referral data when user logs out
  useEffect(() => {
    if (!authenticated || !account?.address) {
      setReferralAmount(0);
      setUserReferralCode("");
      setReferralBy("");
    }
  }, [authenticated, account?.address]);

  const handleBack = () => {
    mediumHaptic();
    router.back();
  };

  const handleIntroClick = () => {
    mediumHaptic();
    setShowIntro(true);
  };

  const handleApplyReferralCode = async () => {
    if (!inputReferralCode.trim()) {
      errorHaptic();
      toast.error("Please enter a referral code");
      return;
    }

    if (!account?.address) {
      toast.error("Please connect your wallet", {
        description: "You need to connect your wallet to use referral codes",
      });
      return;
    }

    // Check if user already has a referral
    if (referralBy) {
      toast.error("Referral code already applied", {
        description:
          "You cannot change your referral code once it's been applied",
      });
      return;
    }

    // Check if user is trying to use their own referral code
    if (userReferralCode === inputReferralCode.trim()) {
      toast.error("You cannot refer yourself", {
        description: "Please use someone else's referral code",
      });
      return;
    }

    heavyHaptic();
    setIsApplyingReferral(true);

    try {
      const response = await fetch("/api/points", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: account.address,
          referralCode: inputReferralCode.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Referral code applied successfully!", {
          description: "You can now earn rewards through referrals",
        });
        setInputReferralCode("");

        // Refresh the referral data
        const refreshResponse = await fetch(
          `/api/points?address=${account.address}`
        );
        const refreshData = await refreshResponse.json();
        if (refreshData.success && refreshData.data) {
          setUserReferralCode(refreshData.data.referralCode || "");
          setReferralBy(refreshData.data.referralBy || "");
        }

        // Refresh referral count
        const countResponse = await fetch(
          `/api/points?address=${account.address}&countReferrals=true`
        );
        const countData = await countResponse.json();
        if (countData.success) {
          setReferralAmount(countData.referralCount || 0);
        }
      } else {
        // Handle specific error messages
        if (data.error === "You cannot refer yourself") {
          toast.error("You cannot refer yourself", {
            description: "Please use someone else's referral code",
          });
        } else if (data.error === "Invalid referral code") {
          toast.error("Invalid referral code", {
            description: "Please check the code and try again",
          });
        } else if (
          data.error === "Referral code already applied and cannot be changed"
        ) {
          toast.error("Referral code already applied", {
            description:
              "You cannot change your referral code once it's been applied",
          });
        } else {
          toast.error(data.error || "Failed to apply referral code", {
            description: "Please try again or contact support",
          });
        }
      }
    } catch (error) {
      console.error("Error in handleApplyReferralCode:", error);
      toast.error("Failed to apply referral code", {
        description:
          "Please try again or contact support if the issue persists",
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
            description: "Share it with friends to earn rewards",
          });
        })
        .catch((err) => {
          // Error handling
        });
    }
  };

  // Handle X verification
  const handleVerifyX = () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first", {
        description: "You need to connect your wallet to verify X",
      });
      return;
    }

    if (xVerified) {
      toast.info("X already verified", {
        description: "You have already completed this mission",
      });
      return;
    }

    setIsVerifyingX(true);
    mediumHaptic();

    // Open X verification in new tab
    const xUrl = "https://x.com/SynthOS_DeFi";
    window.open(xUrl, "_blank");

    // Simulate verification process (in real implementation, this would check actual verification)
    setTimeout(() => {
      setXVerified(true);
      setIsVerifyingX(false);
      toast.success("X verification completed!", {
        description: "You've earned 50 bonus points for verifying X",
      });
      heavyHaptic();
    }, 2000);
  };

  // Handle Telegram verification
  const handleVerifyTelegram = () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first", {
        description: "You need to connect your wallet to verify Telegram",
      });
      return;
    }

    if (telegramVerified) {
      toast.info("Telegram already verified", {
        description: "You have already completed this mission",
      });
      return;
    }

    setIsVerifyingTelegram(true);
    mediumHaptic();

    // Open Telegram verification in new tab
    const telegramUrl = "https://t.me/SynthOS_DeFi";
    window.open(telegramUrl, "_blank");

    // Simulate verification process (in real implementation, this would check actual verification)
    setTimeout(() => {
      setTelegramVerified(true);
      setIsVerifyingTelegram(false);
      toast.success("Telegram verification completed!", {
        description: "You've earned 50 bonus points for verifying Telegram",
      });
      heavyHaptic();
    }, 2000);
  };

  const pointsData = [
    {
      pair: "AAVE/USDC",
      pointsPerDay: 25,
      boost: "2x",
      totalPoints: 450,
    },
    {
      pair: "Compound/USDC",
      pointsPerDay: 20,
      boost: "1.5x",
      totalPoints: 320,
    },
    {
      pair: "Quill/USDC",
      pointsPerDay: 15,
      boost: "1x",
      totalPoints: 180,
    },
    {
      pair: "FX Protocol/USDC",
      pointsPerDay: 30,
      boost: "2.5x",
      totalPoints: 300,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-50 ${
          theme === "dark" ? "bg-[#0f0b22]" : "bg-white"
        } border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
      >
        <div className="flex items-center px-4 py-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className={`p-2 rounded-lg mr-3 ${
              theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
            } transition-colors`}
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`text-xl font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            POINTS DASHBOARD
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleIntroClick}
            className={`ml-3 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            pop up intro
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex flex-col xl:flex-row gap-6 p-4"
      >
        {/* Left Section - Main Dashboard */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex-1 xl:w-[60%]"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl border p-6 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Total Points Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex justify-between items-start mb-6"
            >
              <div className="flex items-center space-x-3">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  POINTS DASHBOARD
                </motion.h2>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className={`px-4 py-2 rounded-lg ${
                  theme === "dark"
                    ? "bg-purple-900/50 border border-purple-500/30"
                    : "bg-purple-50 border border-purple-200"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-purple-300" : "text-purple-700"
                  }`}
                >
                  Total points:{" "}
                  {isLoading ? (
                    <Skeleton className="inline-block w-8 h-4 ml-1" />
                  ) : (
                    totalPoints?.toLocaleString() || "0"
                  )}
                </span>
              </motion.div>
            </motion.div>

            {/* Points Table */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="overflow-x-auto"
            >
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Pairs
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Points/Day
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Boost
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Total points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pointsData.map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.9 + (index * 0.1), 
                        duration: 0.5,
                        ease: "easeOut"
                      }}
                      whileHover={{ 
                        backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                        scale: 1.01
                      }}
                      className={`border-b transition-colors ${
                        theme === "dark"
                          ? "border-gray-700/50"
                          : "border-gray-200"
                      }`}
                    >
                      <td
                        className={`py-3 px-4 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {row.pair}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {row.pointsPerDay}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          theme === "dark"
                            ? "text-purple-400"
                            : "text-purple-600"
                        } font-medium`}
                      >
                        {row.boost}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        } font-semibold`}
                      >
                        {row.totalPoints}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Section - Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="xl:w-[40%] space-y-4"
        >
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className={`rounded-2xl border p-4 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2 mb-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Trophy className="h-5 w-5 text-yellow-500" />
              </motion.div>
              <h3
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Leaderboard
              </h3>
            </div>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              See how you rank among other users
            </p>
          </motion.div>

          {/* Referral Program Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className={`rounded-2xl border p-4 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2 mb-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                <Users className="h-5 w-5 text-blue-500" />
              </motion.div>
              <h3
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Referral Program
              </h3>
            </div>
            {!account?.address ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-center py-3"
              >
                <span
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Please connect wallet to view referral program
                </span>
              </motion.div>
            ) : isLoadingReferral ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <label
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Your Referral Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="flex-1 h-10 bg-gray-300 dark:bg-gray-700" />
                    <Skeleton className="w-10 h-10 bg-gray-300 dark:bg-gray-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Referred By
                  </label>
                  <Skeleton className="w-full h-10 bg-gray-300 dark:bg-gray-700" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="space-y-3"
              >
                {/* Your Referral Code */}
                <div className="space-y-2">
                  <label
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Your Referral Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`flex-1 p-2 rounded-lg border text-sm font-mono ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-gray-50 border-gray-200 text-black"
                      }`}
                    >
                      {userReferralCode || (
                        <Skeleton className="w-16 h-4 bg-gray-300 dark:bg-gray-600" />
                      )}
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopyReferralCode}
                      disabled={!userReferralCode}
                      className={`p-2 rounded-lg border transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 hover:bg-gray-700"
                          : "border-gray-200 hover:bg-gray-100"
                      } ${
                        !userReferralCode ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      aria-label="Copy referral code"
                    >
                      {referralCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Referred By */}
                {referralBy && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="space-y-2"
                  >
                    <label
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Referred By
                    </label>
                    <div
                      className={`p-2 rounded-lg border text-sm font-mono ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-gray-50 border-gray-200 text-black"
                      }`}
                    >
                      {referralBy}
                    </div>
                  </motion.div>
                )}

                {/* Apply Referral Code */}
                {!referralBy && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="space-y-2"
                  >
                    <label
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Apply Referral Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="text"
                        value={inputReferralCode}
                        onChange={(e) => setInputReferralCode(e.target.value)}
                        placeholder="Enter referral code"
                        className={`flex-1 p-2 rounded-lg border text-sm ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-200 text-black placeholder-gray-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        maxLength={8}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleApplyReferralCode}
                        disabled={
                          !inputReferralCode.trim() || isApplyingReferral
                        }
                        className={`p-2 rounded-lg border transition-colors ${
                          theme === "dark"
                            ? "border-gray-600 hover:bg-gray-700"
                            : "border-gray-200 hover:bg-gray-100"
                        } ${
                          !inputReferralCode.trim() || isApplyingReferral
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {isApplyingReferral ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
                {/* Referral Amount */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  className="mt-3 flex justify-center"
                >
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-blue-800 dark:text-blue-200 text-xs font-semibold border border-blue-200 dark:border-blue-800 text-center">
                    You have referred <b>{referralAmount}</b> people.
                  </div>
                </motion.div>
                {/* Referral Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className={`text-xs text-center ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Share your referral code with friends!
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* One Time Points Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className={`rounded-2xl border p-4 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2 mb-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
              >
                <Gift className="h-5 w-5 text-purple-500" />
              </motion.div>
              <h3
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                One time points mission
              </h3>
            </div>
            
            <div className="space-y-3">
              {/* X Verification Task */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className={`p-3 rounded-lg border ${
                  xVerified
                    ? theme === "dark"
                      ? "bg-green-900/20 border-green-500/30"
                      : "bg-green-50 border-green-200"
                    : theme === "dark"
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      xVerified
                        ? "bg-green-500/20"
                        : theme === "dark"
                        ? "bg-gray-600"
                        : "bg-gray-200"
                    }`}>
                      <Twitter className={`h-4 w-4 ${
                        xVerified ? "text-green-500" : "text-gray-500"
                      }`} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        Verify X (Twitter)
                      </h4>
                      <p className={`text-xs ${
                        xVerified
                          ? "text-green-600 dark:text-green-400"
                          : theme === "dark"
                          ? "text-gray-400"
                          : "text-gray-600"
                      }`}>
                        {xVerified ? "Completed • +50 points" : "Follow us on X for bonus points"}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVerifyX}
                    disabled={xVerified || isVerifyingX}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      xVerified
                        ? "bg-green-500 text-white cursor-default"
                        : isVerifyingX
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : theme === "dark"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {xVerified ? (
                      <Check className="h-3 w-3" />
                    ) : isVerifyingX ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Telegram Verification Task */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className={`p-3 rounded-lg border ${
                  telegramVerified
                    ? theme === "dark"
                      ? "bg-green-900/20 border-green-500/30"
                      : "bg-green-50 border-green-200"
                    : theme === "dark"
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      telegramVerified
                        ? "bg-green-500/20"
                        : theme === "dark"
                        ? "bg-gray-600"
                        : "bg-gray-200"
                    }`}>
                      <MessageCircle className={`h-4 w-4 ${
                        telegramVerified ? "text-green-500" : "text-gray-500"
                      }`} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        Verify Telegram
                      </h4>
                      <p className={`text-xs ${
                        telegramVerified
                          ? "text-green-600 dark:text-green-400"
                          : theme === "dark"
                          ? "text-gray-400"
                          : "text-gray-600"
                      }`}>
                        {telegramVerified ? "Completed • +50 points" : "Join our Telegram for bonus points"}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVerifyTelegram}
                    disabled={telegramVerified || isVerifyingTelegram}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      telegramVerified
                        ? "bg-green-500 text-white cursor-default"
                        : isVerifyingTelegram
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : theme === "dark"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {telegramVerified ? (
                      <Check className="h-3 w-3" />
                    ) : isVerifyingTelegram ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Mission Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  Total completed: {[xVerified, telegramVerified].filter(Boolean).length}/2
                </span>
                <span className={`font-medium ${
                  theme === "dark" ? "text-purple-400" : "text-purple-600"
                }`}>
                  +{([xVerified, telegramVerified].filter(Boolean).length * 50)} points
                </span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Intro Popup */}
      {showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowIntro(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`relative rounded-2xl p-6 max-w-md w-full ${
              theme === "dark"
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Points Dashboard Guide
            </h3>
            <div
              className={`space-y-3 text-sm ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <p>
                • <strong>Pairs:</strong> The protocol pairs you're invested in
              </p>
              <p>
                • <strong>Points/Day:</strong> Daily points earned from each
                pair
              </p>
              <p>
                • <strong>Boost:</strong> Multiplier applied to your points
              </p>
              <p>
                • <strong>Total Points:</strong> Cumulative points from each
                pair
              </p>
              <p>
                • <strong>Leaderboard:</strong> Compare your ranking with others
              </p>
              <p>
                • <strong>Referral Programme:</strong> Earn 3% bonus for
                referrals
              </p>
              <p>
                • <strong>One Time Missions:</strong> Complete special tasks for
                bonus points
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowIntro(false)}
              className={`mt-6 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              Got it!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
