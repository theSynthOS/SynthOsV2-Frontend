"use client";

import { History, Settings, Moon, Sun, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Image from "next/image";
import SettingsPanel from "@/components/setting-panel/settings-panel";
import HistoryPanel from "@/components/features/history-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivy } from "@privy-io/react-auth";
import { mediumHaptic } from "@/lib/haptic-utils";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { createPortal } from "react-dom";

export default function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, authenticated } = usePrivy();
  const { displayAddress, smartWalletClient, isSmartWalletActive } =
    useSmartWallet();

  // Use display address from context
  const account =
    authenticated && displayAddress ? { address: displayAddress } : null;

  // Set mounted to true on initial load to enable theme rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme between dark and light
  const toggleTheme = () => {
    mediumHaptic();
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePointsClick = () => {
    mediumHaptic();
    router.push("/points");
  };

  return (
    <div
      className={`flex justify-between items-center px-4 py-3 relative z-10 transition-all duration-300`}
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
        <button
          onClick={handlePointsClick}
          className="hidden xl:flex items-center ml-2 group"
        >
          <div className="flex items-center justify-center w-28 h-12 px-4 rounded-lg border-2 border-[#8266E6] bg-white dark:bg-[#1E1E1E] shadow-sm transition-all duration-200 group-hover:border-purple-500 group-hover:shadow-lg">
            <Award className="h-5 w-5 text-[#8266E6] mr-2 group-hover:text-purple-500 transition-colors" />
            <span className="text-lg font-bold text-[#8266E6] dark:text-[#FFD659] group-hover:text-purple-500 transition-colors">
              0
            </span>
            <span className="text-xs font-semibold text-[#8266E6] ml-1 group-hover:text-purple-500 transition-colors">
              Pts
            </span>
          </div>
        </button>

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
          onClick={() => {
            mediumHaptic();
            setIsHistoryOpen(true);
          }}
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
          onClick={() => {
            mediumHaptic();
            setIsSettingsOpen(true);
          }}
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
      {isSettingsOpen && (
        typeof document !== "undefined"
          ? createPortal(
              <SettingsPanel
                isOpen={true}
                onClose={() => setIsSettingsOpen(false)}
              />, 
              document.body
            )
          : (
              <SettingsPanel
                isOpen={true}
                onClose={() => setIsSettingsOpen(false)}
              />
            )
      )}

      {/* History panel */}
      {isHistoryOpen && (
        typeof document !== "undefined"
          ? createPortal(
              <HistoryPanel
                isOpen={true}
                onClose={() => setIsHistoryOpen(false)}
              />, 
              document.body
            )
          : (
              <HistoryPanel
                isOpen={true}
                onClose={() => setIsHistoryOpen(false)}
              />
            )
      )}
    </div>
  );
}
