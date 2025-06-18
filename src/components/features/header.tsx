"use client";

import { History, Settings, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Image from "next/image";
import SettingsPanel from "@/components/profile/settings-panel";
import HistoryPanel from "@/components/features/history-panel";

export default function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted to true on initial load to enable theme rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme between dark and light
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div
      className={`flex justify-between items-center px-4 py-3 ${
        theme === "dark"
          ? "bg-[#0f0b22]"
          : "bg-[#f0eef9]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center">
        <Image
          src={theme === "dark" ? "/SynthOS-icon+word-white.png" : "/SynthOS-icon+word.png"}
          alt="SynthOS Logo"
          width={200}
          height={200}
          className="mr-2 w-32"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2">
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-full ${
            theme === "dark" ? "bg-[#1E1E1E]" : "bg-[#8266E6]"
          } flex items-center justify-center transition-colors border ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {mounted && theme === "dark" ? (
            <Moon className="h-5 w-5 text-gray-400" />
          ) : (
            <Sun className="h-5 w-5 text-white" />
          )}
        </button>

        {/* History button */}
        <button
          className={`w-10 h-10 rounded-full ${
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
