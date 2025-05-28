"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, History } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import investmentHistory from "@/data/investment-history.json";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InvestmentHistory {
  id: string;
  protocolName: string;
  pairName: string;
  amount: number;
  expectedApy: number;
  timestamp: string;
  status: "active" | "completed" | "failed";
  chain: string;
  protocolLogo: string;
  walletAddress: string;
  details: {
    type: string;
    riskLevel: string;
    lockPeriod: string;
    minAmount: number;
    maxAmount: number;
  };
}

interface InvestmentHistoryData {
  investments: InvestmentHistory[];
  metadata: {
    totalInvestments: number;
    totalActiveInvestments: number;
    totalAmount: number;
    averageApy: number;
    lastUpdated: string;
  };
}

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const { theme } = useTheme();
  const { address } = useAuth();
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [history, setHistory] = useState<InvestmentHistory[]>([]);
  const [metadata, setMetadata] = useState<
    InvestmentHistoryData["metadata"] | null
  >(null);

  useEffect(() => {
    if (!address) {
      setHistory([]);
      setMetadata(null);
      return;
    }

    // In a real app, this would be an API call
    const data = investmentHistory as InvestmentHistoryData;

    // Filter investments for current wallet
    const walletInvestments = data.investments.filter(
      (inv) => inv.walletAddress.toLowerCase() === address.toLowerCase()
    );

    // Calculate metadata for current wallet
    const walletMetadata = {
      totalInvestments: walletInvestments.length,
      totalActiveInvestments: walletInvestments.filter(
        (inv) => inv.status === "active"
      ).length,
      totalAmount: walletInvestments.reduce((sum, inv) => sum + inv.amount, 0),
      averageApy:
        walletInvestments.length > 0
          ? walletInvestments.reduce((sum, inv) => sum + inv.expectedApy, 0) /
            walletInvestments.length
          : 0,
      lastUpdated: data.metadata.lastUpdated,
    };

    setHistory(walletInvestments);
    setMetadata(walletMetadata);
  }, [address]);

  const handleGoBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleInvestmentClick = (investment: InvestmentHistory) => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
      // Navigate to the investment details page
      router.push(`/investment/${investment.id}`);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Semi-transparent backdrop */}
      <div
        className={`fixed inset-0 ${
          theme === "dark" ? "bg-black/20" : "bg-gray-900/10"
        } backdrop-blur-[2px]`}
        style={{
          animation: isExiting
            ? "fadeOut 0.3s ease-out"
            : "fadeIn 0.3s ease-out",
        }}
        onClick={handleGoBack}
      />

      {/* Sliding panel */}
      <div
        className={`fixed left-0 top-0 h-full w-full max-w-md transform transition-all duration-300 ease-out`}
        style={{
          animation: isExiting
            ? "slideOutLeft 0.3s ease-out"
            : "slideInLeft 0.3s ease-out",
          borderRadius: "0 16px 16px 0",
          boxShadow:
            theme === "dark"
              ? "0 0 40px rgba(0, 0, 0, 0.3)"
              : "0 0 40px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          className={`h-full flex flex-col ${
            theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-white text-black"
          }`}
        >
          {/* Header - Fixed */}
          <div className="flex-none px-4 py-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={handleGoBack}
              className="w-8 h-8 flex items-center justify-center"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">Investment History</h1>
            <div className="w-8 h-8"></div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-hidden">
            {!address ? (
              <div className="h-full flex items-center justify-center px-4">
                <p
                  className={`text-center ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Please connect your wallet to view investment history
                </p>
              </div>
            ) : history.length === 0 ? (
              <div className="h-full flex items-center justify-center px-4">
                <p
                  className={`text-center ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No investments found for this wallet
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Summary Stats - Fixed */}
                {metadata && (
                  <div className="flex-none px-4 py-4 grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-800">
                    <div
                      className={`p-4 rounded-xl ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Total Active
                      </p>
                      <p className="text-xl font-bold">
                        {metadata.totalActiveInvestments}
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-xl ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Avg. APY
                      </p>
                      <p className="text-xl font-bold text-green-500">
                        {metadata.averageApy.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                {/* History List - Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`mb-4 p-4 rounded-xl ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"
                      } cursor-pointer hover:bg-opacity-80 transition-colors`}
                      onClick={() => handleInvestmentClick(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{item.protocolName}</h3>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            {item.pairName}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.status === "active"
                              ? "bg-green-500/20 text-green-500"
                              : item.status === "completed"
                              ? "bg-blue-500/20 text-blue-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div>
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Amount
                          </p>
                          <p className="font-semibold">
                            ${item.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Expected APY
                          </p>
                          <p className="font-semibold text-green-500">
                            {item.expectedApy}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p
                          className={`text-xs ${
                            theme === "dark" ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                          }`}
                        >
                          {item.details.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slideOutLeft {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
