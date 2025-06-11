"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chain?: string;
}

interface Transfer {
  asset: string;
  symbol: string;
  amount: number;
  direction: "debit" | "credit";
}

interface Transaction {
  id: string;
  protocolName: string;
  transfers: Transfer[];
  txType: string;
  summary: string;
  timestamp: string;
  status: "active" | "completed" | "failed";
  chain: string;
  protocolLogo: string;
  walletAddress: string;
}

interface TransactionData {
  transactions: Transaction[];
  metadata: {
    totalTransactions: number;
    totalSuccessful: number;
    totalAmount: number;
    lastUpdated: string;
    chain: string;
    symbol: string;
    explorer: string;
  };
}

export default function HistoryPanel({
  isOpen,
  onClose,
  chain = "scrollSepolia",
}: HistoryPanelProps) {
  const { theme } = useTheme();
  const account = useActiveAccount();
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metadata, setMetadata] = useState<TransactionData["metadata"] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account?.address) {
      setTransactions([]);
      setMetadata(null);
      setIsLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/transactions?address=${account.address}`);
        const data = await response.json();

        if (data.success) {
          setTransactions(data.transactions || []);
          setMetadata(data.metadata || null);
        } else {
          setError(data.message || "Failed to fetch transactions");
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Failed to fetch transactions. Please try again.");
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchTransactions();
    }
  }, [account, isOpen]);

  const handleGoBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
      // Use the explorer URL from metadata
      if (metadata?.explorer) {
        window.open(`${metadata.explorer}/tx/${transaction.id}`, "_blank");
      }
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
          {/* Header */}
          <div className="flex-none px-4 py-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={handleGoBack}
              className="w-8 h-8 flex items-center justify-center"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">Transaction History</h1>
            <div className="w-8 h-8"></div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {!account ? (
              <div className="h-full flex items-center justify-center px-4">
                <p
                  className={`text-center ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Please connect your wallet to view transactions
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`mb-4 p-4 rounded-xl ${
                      theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="w-24 h-6 rounded bg-gray-300 dark:bg-gray-700" />
                      <Skeleton className="w-16 h-5 rounded bg-gray-300 dark:bg-gray-700" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Skeleton className="w-20 h-6 rounded bg-gray-300 dark:bg-gray-700" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Skeleton className="w-28 h-4 rounded bg-gray-300 dark:bg-gray-700" />
                      <Skeleton className="w-20 h-4 rounded bg-gray-300 dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center px-4">
                <p className={`text-center text-red-500`}>{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="h-full flex items-center justify-center px-4">
                <p
                  className={`text-center ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No transactions found for this wallet
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Summary Stats */}
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
                        Total Transactions
                      </p>
                      <p className="text-xl font-bold">
                        {metadata.totalTransactions}
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
                        Total Amount
                      </p>
                      <p className="text-xl font-bold">
                        ${metadata.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {transactions.map((tx) => {
                    // Find the first debit transfer (deposited/sent), fallback to first transfer
                    const deposit =
                      tx.transfers.find((tr) => tr.direction === "debit") ||
                      tx.transfers[0];
                    return (
                      <div
                        key={tx.id}
                        className={`mb-4 p-4 rounded-xl ${
                          theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"
                        } cursor-pointer hover:bg-opacity-80 transition-colors`}
                        onClick={() => handleTransactionClick(tx)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {tx.txType.charAt(0).toUpperCase() +
                                tx.txType.slice(1)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {tx.summary}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              tx.status === "completed"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {tx.status.charAt(0).toUpperCase() +
                              tx.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-base font-bold">
                            {deposit
                              ? `${deposit.amount.toFixed(2)} ${deposit.symbol}`
                              : "-"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p
                            className={`text-xs ${
                              theme === "dark"
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                          >
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                            }`}
                          >
                            {tx.chain}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
