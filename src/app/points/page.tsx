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

  useEffect(() => {
    const fetchPoints = async () => {
      if (!authenticated || !account?.address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // For now, we'll use a placeholder since we removed the points API
        // You can implement your own points system here
        setTotalPoints(1250);
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

  // Handle referral code from URL
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
      return;
    }
    if (!account?.address) {
      toast.error("Please connect your wallet", {
        description: "You need to connect your wallet to use referral codes",
      });
      return;
    }
    heavyHaptic();
    setIsApplyingReferral(true);
    try {
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

      if (data.success) {
        toast.success("Referral code applied successfully!", {
          description: "You can now earn rewards through referrals",
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
            description: "Please use someone else's referral code",
          });
        } else {
          toast.error(data.error || "Failed to apply referral code", {
            description: "Please try again or Invalid referral code",
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
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* Header */}
      <div
        className={`sticky top-0 z-50 ${
          theme === "dark" ? "bg-[#0f0b22]" : "bg-white"
        } border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
      >
        <div className="flex items-center px-4 py-3">
          <button
            onClick={handleBack}
            className={`p-2 rounded-lg mr-3 ${
              theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
            } transition-colors`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1
            className={`text-xl font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            POINTS DASHBOARD
          </h1>
          <button
            onClick={handleIntroClick}
            className={`ml-3 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            pop up intro
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 p-4">
        {/* Left Section - Main Dashboard */}
        <div className="flex-1">
          <div
            className={`rounded-2xl border p-6 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Total Points Display */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  POINTS DASHBOARD
                </h2>
              </div>
              <div
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
              </div>
            </div>

            {/* Points Table */}
            <div className="overflow-x-auto">
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
                    <tr
                      key={index}
                      className={`border-b ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section - Sidebar */}
        <div className="lg:w-80 space-y-4">
          {/* Leaderboard */}
          <div
            className={`rounded-2xl border p-4 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2 mb-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
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
          </div>

          {/* Referral Programme */}
          <div
            className={`rounded-2xl border p-4 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-5 w-5 text-blue-500" />
              <h3
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Referral programme
              </h3>
            </div>
            <div className="space-y-2">
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Special Boost
              </p>
              <p
                className={`text-lg font-bold ${
                  theme === "dark" ? "text-green-400" : "text-green-600"
                }`}
              >
                3%
              </p>
            </div>
          </div>

          {/* One Time Points Mission */}
          <div
            className={`rounded-2xl border p-4 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2 mb-3">
              <Gift className="h-5 w-5 text-purple-500" />
              <h3
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                One time points mission
              </h3>
            </div>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Complete special missions for bonus points
            </p>
          </div>

          {/* Referral Program Section */}
          <div
            className={`rounded-2xl border p-4 ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-5 w-5 text-blue-500" />
              <h3
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Referral Program
              </h3>
            </div>

            {!account?.address ? (
              <div className="text-center py-3">
                <span
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Please connect wallet to view referral program
                </span>
              </div>
            ) : isLoadingReferral ? (
              <div className="space-y-3">
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
              </div>
            ) : (
              <div className="space-y-3">
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
                    <div
                      className={`flex-1 p-2 rounded-lg border text-sm font-mono ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-gray-50 border-gray-200 text-black"
                      }`}
                    >
                      {userReferralCode || (
                        <Skeleton className="w-16 h-4 bg-gray-300 dark:bg-gray-600" />
                      )}
                    </div>
                    <button
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
                    </button>
                  </div>
                </div>

                {/* Referred By */}
                {referralBy && (
                  <div className="space-y-2">
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
                  </div>
                )}

                {/* Apply Referral Code */}
                {!referralBy && (
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                        className={`flex-1 p-2 rounded-lg border text-sm ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-gray-50 border-gray-200 text-black placeholder-gray-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        maxLength={8}
                      />
                      <button
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
                      </button>
                    </div>
                  </div>
                )}

                {/* Referral Amount */}
                <div className="mt-3 flex justify-center">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-blue-800 dark:text-blue-200 text-xs font-semibold border border-blue-200 dark:border-blue-800 text-center">
                    You have referred <b>{referralAmount}</b> people.
                  </div>
                </div>

                {/* Referral Info */}
                <div
                  className={`text-xs text-center ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Share your referral code with friends!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intro Popup */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowIntro(false)}
          />
          <div
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
            <button
              onClick={() => setShowIntro(false)}
              className={`mt-6 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
