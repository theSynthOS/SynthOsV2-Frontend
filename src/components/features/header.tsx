"use client";

import { Home, Award, Wallet, Settings, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import SettingsPanel from "@/components/profile/settings-panel";
import HistoryPanel from "@/components/features/history-panel";

export default function Header() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div
      className={`flex justify-between items-center p-4 ${
        theme === "dark"
          ? "bg-[#0f0b22] border-gray-700/0 hover:border-gray-700"
          : "bg-white border-gray-200/0 hover:border-gray-200"
      } border-b`}
    >
      <button
        className={`w-8 h-8 rounded-full ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-100"
        } flex items-center justify-center`}
        onClick={() => setIsHistoryOpen(true)}
      >
        <History
          className={`h-4 w-4 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        />
      </button>

      <button
        className={`w-8 h-8 rounded-full ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-100"
        } flex items-center justify-center`}
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings
          className={`h-4 w-4 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        />
      </button>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
