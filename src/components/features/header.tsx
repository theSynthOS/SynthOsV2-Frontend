"use client";

import { History, Settings, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Image from "next/image";
import SettingsPanel from "@/components/setting-panel/settings-panel";
import HistoryPanel from "@/components/features/history-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveAccount } from "thirdweb/react";
import { usePoints } from "@/contexts/PointsContext";

export default function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const account = useActiveAccount();
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const { lastRefresh } = usePoints();

  // Set mounted to true on initial load to enable theme rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!account?.address) return;
      try {
        setIsLoadingPoints(true);
        const params = new URLSearchParams();
        if (account.address) params.append("address", account.address);
        const res = await fetch(`/api/points?${params.toString()}`);
        const data = await res.json();
        if (data.user) {
          const u = data.user;
          setTotalPoints(
            (u.pointsLogin || 0) +
              (u.pointsDeposit || 0) +
              (u.pointsFeedback || 0) +
              (u.pointsShareX || 0) +
              (u.pointsTestnetClaim || 0)
          );
        } else {
          setTotalPoints(null);
        }
      } catch (e) {
        setTotalPoints(null);
      } finally {
        setIsLoadingPoints(false);
      }
    };
    fetchPoints();
  }, [account, lastRefresh]);

  // Toggle theme between dark and light
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div
      className={`flex justify-between items-center px-4 py-3 bg-white/10 dark:bg-black/10 backdrop-blur-md relative z-10`}
    >
      {/* Logo */}
      <div className="flex items-center">
        <Image
          src={
            theme === "dark"
              ? "/SynthOS-icon+word-white.png"
              : "/SynthOS-icon+word.png"
          }
          alt="SynthOS Logo"
          width={200}
          height={200}
          className="mr-2 w-32 xl:w-[250px]"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2">
        {/* Points Rectangle - only show on XL screens */}
        <div className="hidden xl:flex items-center ml-2">
          <div className="flex items-center justify-center w-28 h-12 px-4 rounded-lg border-2 border-[#8266E6] bg-white dark:bg-[#1E1E1E] shadow-sm">
            {isLoadingPoints || totalPoints === null ? (
              <div className="flex items-center w-full">
                <Skeleton className="w-16 h-6 rounded mr-2 bg-gray-300 dark:bg-gray-700" />
                <span className="text-xs font-semibold text-[#8266E6]">
                  Pts
                </span>
              </div>
            ) : (
              <>
                <span className="text-lg font-bold text-[#8266E6] dark:text-[#FFD659] mr-2">
                  {totalPoints}
                </span>
                <span className="text-xs font-semibold text-[#8266E6]">
                  Pts
                </span>
              </>
            )}
          </div>
        </div>
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-full ${
            theme === "dark" ? "bg-[#1E1E1E]" : "bg-[#8266E6]"
          } flex items-center justify-center transition-colors border ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {mounted && theme === "dark" ? (
            <Moon className="h-5 w-5 text-gray-400" />
          ) : (
            <Sun className="h-5 w-5 text-white" />
          )}
        </button>
        {/* History button */}
        <button
          className={`w-10 h-10 rounded-full xl:hidden ${
            theme === "dark" ? "bg-[#1E1E1E]" : "bg-white"
          } flex items-center justify-center border ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
          onClick={() => setIsHistoryOpen(true)}
          aria-label="Transaction History"
        >
          <History
            className={`h-5 w-5 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
        </button>

        {/* Settings button */}
        <button
          className={`w-10 h-10 rounded-full ${
            theme === "dark" ? "bg-[#1E1E1E]" : "bg-white"
          } flex items-center justify-center border ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Settings"
        >
          <Settings
            className={`h-5 w-5 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
        </button>
      </div>

      {/* Settings panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* History panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
