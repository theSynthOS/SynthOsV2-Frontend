"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { motion } from "framer-motion";
import { ArrowLeft, Info, Trophy, Users, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { mediumHaptic } from "@/lib/haptic-utils";

export default function PointsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { authenticated } = usePrivy();
  const { displayAddress } = useSmartWallet();
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  // Use display address from context
  const account = authenticated && displayAddress ? { address: displayAddress } : null;

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

  const handleBack = () => {
    mediumHaptic();
    router.back();
  };

  const handleIntroClick = () => {
    mediumHaptic();
    setShowIntro(true);
  };

  const pointsData = [
    {
      pair: "AAVE/USDC",
      pointsPerDay: 25,
      boost: "2x",
      totalPoints: 450
    },
    {
      pair: "Compound/USDC",
      pointsPerDay: 20,
      boost: "1.5x",
      totalPoints: 320
    },
    {
      pair: "Quill/USDC",
      pointsPerDay: 15,
      boost: "1x",
      totalPoints: 180
    },
    {
      pair: "FX Protocol/USDC",
      pointsPerDay: 30,
      boost: "2.5x",
      totalPoints: 300
    }
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
      <div className={`sticky top-0 z-50 ${
        theme === "dark" ? "bg-[#0f0b22]" : "bg-white"
      } border-b ${
        theme === "dark" ? "border-gray-800" : "border-gray-200"
      }`}>
        <div className="flex items-center px-4 py-3">
          <button
            onClick={handleBack}
            className={`p-2 rounded-lg mr-3 ${
              theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
            } transition-colors`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className={`text-xl font-semibold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
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
          <div className={`rounded-2xl border p-6 ${
            theme === "dark" 
              ? "bg-gray-800/50 border-gray-700" 
              : "bg-white border-gray-200"
          }`}>
            {/* Total Points Display */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <h2 className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  POINTS DASHBOARD
                </h2>
              </div>
              <div className={`px-4 py-2 rounded-lg ${
                theme === "dark" 
                  ? "bg-purple-900/50 border border-purple-500/30" 
                  : "bg-purple-50 border border-purple-200"
              }`}>
                <span className={`text-sm font-medium ${
                  theme === "dark" ? "text-purple-300" : "text-purple-700"
                }`}>
                  Total points: {isLoading ? (
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
                  <tr className={`border-b ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Pairs
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Points/Day
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Boost
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Total points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pointsData.map((row, index) => (
                    <tr 
                      key={index}
                      className={`border-b ${
                        theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                      }`}
                    >
                      <td className={`py-3 px-4 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {row.pair}
                      </td>
                      <td className={`py-3 px-4 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}>
                        {row.pointsPerDay}
                      </td>
                      <td className={`py-3 px-4 ${
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
                      } font-medium`}>
                        {row.boost}
                      </td>
                      <td className={`py-3 px-4 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      } font-semibold`}>
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
          <div className={`rounded-2xl border p-4 ${
            theme === "dark" 
              ? "bg-gray-800/50 border-gray-700" 
              : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Leaderboard
              </h3>
            </div>
            <p className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              See how you rank among other users
            </p>
          </div>

          {/* Referral Programme */}
          <div className={`rounded-2xl border p-4 ${
            theme === "dark" 
              ? "bg-gray-800/50 border-gray-700" 
              : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Referral programme
              </h3>
            </div>
            <div className="space-y-2">
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Special Boost
              </p>
              <p className={`text-lg font-bold ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`}>
                3%
              </p>
            </div>
          </div>

          {/* One Time Points Mission */}
          <div className={`rounded-2xl border p-4 ${
            theme === "dark" 
              ? "bg-gray-800/50 border-gray-700" 
              : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <Gift className="h-5 w-5 text-purple-500" />
              <h3 className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                One time points mission
              </h3>
            </div>
            <p className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              Complete special missions for bonus points
            </p>
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
          <div className={`relative rounded-2xl p-6 max-w-md w-full ${
            theme === "dark" 
              ? "bg-gray-800 border border-gray-700" 
              : "bg-white border border-gray-200"
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Points Dashboard Guide
            </h3>
            <div className={`space-y-3 text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
              <p>• <strong>Pairs:</strong> The protocol pairs you're invested in</p>
              <p>• <strong>Points/Day:</strong> Daily points earned from each pair</p>
              <p>• <strong>Boost:</strong> Multiplier applied to your points</p>
              <p>• <strong>Total Points:</strong> Cumulative points from each pair</p>
              <p>• <strong>Leaderboard:</strong> Compare your ranking with others</p>
              <p>• <strong>Referral Programme:</strong> Earn 3% bonus for referrals</p>
              <p>• <strong>One Time Missions:</strong> Complete special tasks for bonus points</p>
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