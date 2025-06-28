"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { History } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import DynamicFeatures from "@/components/home/dynamic-features";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react";
import { Skeleton } from "@/components/ui/skeleton";
import { MoveUp, MoveDown, Send, Plus, Copy, Check } from "lucide-react";
import { usePoints } from "@/contexts/PointsContext";
import SendModal from "@/components/features/wallet-send";
import BuyModal from "@/components/features/wallet-buy";
import WalletDeposit from "@/components/features/wallet-deposit";
import HoldingPage from "@/app/holding/page";
import HistoryPanel from "@/components/features/history-panel";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { refreshPoints } = usePoints();
  const { toast } = useToast();
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const account = useActiveAccount();
  const [showModal, setShowModal] = useState<"deposit" | "send" | "buy" | null>(
    null
  );

  // Check URL parameters for modal to open
  useEffect(() => {
    const modalParam = searchParams.get("modal");
    if (
      modalParam === "deposit" ||
      modalParam === "send" ||
      modalParam === "buy"
    ) {
      setShowModal(modalParam);

      // Clear the URL parameter without page refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("modal");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams]);

  const fetchBalance = async (walletAddress: string) => {
    try {
      setIsLoadingBalance(true);
      const response = await fetch(`/api/balance?address=${walletAddress}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      const data = await response.json();
      setBalance(data.totalUsdBalance || "0.00");
      // Refresh points after balance update
      refreshPoints();
      return data.totalUsdBalance || "0.00";
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.00");
      return "0.00";
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch balance when account changes
  useEffect(() => {
    if (account?.address) {
      fetchBalance(account.address);
    } else {
      setIsLoadingBalance(false);
    }
  }, [account]);

  // Close modal
  const closeModal = () => {
    setShowModal(null);
  };

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Update display address whenever account changes
  useEffect(() => {
    if (account?.address) {
      setDisplayAddress(account.address);
    } else {
      setDisplayAddress(null);
    }
  }, [account]);

  // Handle copy address to clipboard
  const handleCopyAddress = () => {
    if (displayAddress) {
      navigator.clipboard
        .writeText(displayAddress)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast({
            title: "Address copied",
            description: "Wallet address copied to clipboard",
          });
        })
        .catch((err) => {
          console.error("Failed to copy address: ", err);
        });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col"
    >
      <div className="flex flex-col xl:flex-row">
        <div className="flex flex-col xl:w-4/6 xl:pl-5">
          {/* Balance */}
          <motion.div
            className="w-full justify-center mt-[0px] px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div
              className={`${
                theme === "dark" ? "bg-[#1E1E1ECC]" : "bg-[#FFFFFFA6]"
              } rounded-t-2xl px-4 xl:px-6 pt-6 w-full text-center xl:text-left relative overflow-hidden xl:mt-[45px] min-h-[140px]`}
            >
              {/* Logo at the back, inside the card */}
              <img
                src="/half-sythos.png"
                alt=""
                className="hidden xl:block absolute right-0 top-7/10 -translate-y-3/5 -translate-x-[50%] w-[340px] pointer-events-none select-none z-0"
                style={{ opacity: 0.7 }}
              />

              {/* Blurred circle, if needed */}
              {theme === "dark" && (
                <div
                  className="absolute -top-46 -left-26 w-96 h-96 rounded-full opacity-[50%] z-0"
                  style={{
                    background: "#3C229C80",
                    filter: "blur(40px)",
                  }}
                />
              )}

              {/* Main content */}
              <div className="relative z-10 xl:flex xl:justify-between xl:flex-row">
                <div className="relative z-10">
                  <div className="text-sm xl:text-lg tracking-widest text-[#727272] font-light xl:font-medium mb-2">
                    TOTAL BALANCE
                  </div>
                  <div
                    className={`py-6 xl:py-0 font-medium text-4xl xl:text-5xl leading-[100%] tracking-[-0.03em] uppercase ${
                      theme === "dark" ? "text-[#FFCA59]" : "text-gray-900"
                    }`}
                    style={
                      theme === "dark"
                        ? { textShadow: "0px 0px 12px #FFCA5980" }
                        : {}
                    }
                  >
                    {isLoadingBalance ? (
                      <Skeleton className="w-32 h-7 xl:w-52 xl:h-12 rounded-sm bg-gray-300 dark:bg-gray-800 mx-auto xl:mx-0" />
                    ) : (
                      `$${parseFloat(balance).toFixed(2)}`
                    )}
                  </div>
                  {/* Action Buttons-- originally justify-between */}
                  <div className="flex justify-between xl:justify-start w-full mx-auto xl:mx-0 p-4 xl:gap-4 xl:pl-0">
                    <button
                      onClick={() => setShowModal("deposit")}
                      className="flex flex-col xl:flex-row xl:items-center xl:gap-3 group"
                    >
                      <div
                        className={`w-14 h-14 xl:w-auto xl:h-auto xl:px-4 xl:py-3 rounded-full xl:rounded-lg flex items-center justify-center mb-2 xl:mb-0 border transition-all duration-200 relative ${
                          theme === "dark"
                            ? "bg-[#FFFFFF0D] border-[#402D86B2] group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] group-hover:border-[#8266E6]"
                            : "bg-[#FFFFFFA6] border-[#DDDDDD] group-hover:bg-[#8266E6] group-hover:border-[#8266E6]"
                        } xl:bg-transparent xl:border-[#afabbc] xl:backdrop-blur-[75px] ${
                          theme === "dark"
                            ? "xl:shadow-[0px_0px_9px_1px_#402D86B2_inset]"
                            : ""
                        } ${
                          theme === "dark"
                            ? "xl:group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] xl:group-hover:border-transparent"
                            : ""
                        }`}
                      >
                        <MoveDown
                          size={15}
                          className={`transform rotate-45 transition-colors duration-200 xl:w-[22px] xl:h-[22px] ${
                            theme === "dark" ? "text-white" : "text-[#8266E6]"
                          } group-hover:text-white`}
                        />
                        <span
                          className={`text-sm font-medium ml-2 hidden xl:block transition-colors duration-200 xl:text-[20px] ${
                            theme === "dark"
                              ? "text-white"
                              : "text-black group-hover:text-white"
                          }`}
                        >
                          Deposit
                        </span>
                      </div>
                      <span className="text-sm font-medium xl:hidden">
                        Deposit
                      </span>
                    </button>

                    <button
                      onClick={() => setShowModal("send")}
                      className="flex flex-col xl:flex-row xl:items-center xl:gap-3 group"
                    >
                      <div
                        className={`w-14 h-14 xl:w-auto xl:h-auto xl:px-4 xl:py-3 rounded-full xl:rounded-lg flex items-center justify-center mb-2 xl:mb-0 border transition-all duration-200 relative ${
                          theme === "dark"
                            ? "bg-[#FFFFFF0D] border-[#402D86B2] group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] group-hover:border-[#8266E6]"
                            : "bg-[#FFFFFFA6] border-[#DDDDDD] group-hover:bg-[#8266E6] group-hover:border-[#8266E6]"
                        } xl:bg-transparent xl:border-[#afabbc] xl:backdrop-blur-[75px] ${
                          theme === "dark"
                            ? "xl:shadow-[0px_0px_9px_1px_#402D86B2_inset]"
                            : ""
                        } ${
                          theme === "dark"
                            ? "xl:group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] xl:group-hover:border-transparent"
                            : ""
                        }`}
                      >
                        <MoveUp
                          size={15}
                          className={`transform -rotate-45 transition-colors duration-200 xl:w-[22px] xl:h-[22px] ${
                            theme === "dark" ? "text-white" : "text-[#8266E6]"
                          } group-hover:text-white`}
                        />
                        <span
                          className={`text-sm font-medium ml-2 hidden xl:block transition-colors duration-200 xl:text-[20px] ${
                            theme === "dark"
                              ? "text-white"
                              : "text-black group-hover:text-white"
                          }`}
                        >
                          Send
                        </span>
                      </div>
                      <span className="text-sm font-medium xl:hidden">
                        Send
                      </span>
                    </button>

                    <button
                      onClick={() => setShowModal("buy")}
                      className="flex flex-col xl:flex-row xl:items-center xl:gap-3 group"
                    >
                      <div
                        className={`w-14 h-14 xl:w-auto xl:h-auto xl:px-4 xl:py-3 rounded-full xl:rounded-lg flex items-center justify-center mb-2 xl:mb-0 border transition-all duration-200 relative ${
                          theme === "dark"
                            ? "bg-[#FFFFFF0D] border-[#402D86B2] group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] group-hover:border-transparent"
                            : "bg-[#FFFFFFA6] border-[#DDDDDD] group-hover:bg-[#8266E6] group-hover:border-transparent"
                        } xl:bg-transparent xl:border-[#afabbc] xl:backdrop-blur-[75px] ${
                          theme === "dark"
                            ? "xl:shadow-[0px_0px_9px_1px_#402D86B2_inset]"
                            : ""
                        } ${
                          theme === "dark"
                            ? "xl:group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] xl:group-hover:border-transparent"
                            : ""
                        }`}
                      >
                        <Plus
                          size={15}
                          className={`transition-colors duration-200 xl:w-[22px] xl:h-[22px] ${
                            theme === "dark" ? "text-white" : "text-[#8266E6]"
                          } group-hover:text-white`}
                        />
                        <span
                          className={`text-sm font-medium ml-2 hidden xl:block transition-colors duration-200 xl:text-[20px] ${
                            theme === "dark"
                              ? "text-white"
                              : "text-black group-hover:text-white"
                          }`}
                        >
                          Buy
                        </span>
                      </div>
                      <span className="text-sm font-medium xl:hidden">Buy</span>
                    </button>
                  </div>
                </div>

                <div className="xl:block hidden">
                  <button
                    className={`px-4 py-3 rounded-lg transition-all duration-200 group ${
                      theme === "dark" ? "bg-[#1E1E1E]" : "bg-white"
                    } flex items-center justify-center border gap-2 ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    } xl:bg-transparent xl:border-[#afabbc] xl:backdrop-blur-[75px] ${
                      theme === "dark"
                        ? "xl:shadow-[0px_0px_9px_1px_#402D86B2_inset]"
                        : ""
                    } ${
                      theme === "dark"
                        ? "xl:hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] xl:hover:border-transparent"
                        : "xl:hover:bg-[#8266E6] xl:hover:border-[#8266E6]"
                    }`}
                    onClick={() => setIsHistoryOpen(true)}
                    aria-label="Transaction History"
                  >
                    <History
                      className={`h-5 w-5 transition-colors duration-200 ${
                        theme === "dark" ? "text-gray-400" : "text-[#8266E6]"
                      } group-hover:text-white`}
                    />
                    <span
                      className={`text-[20px] font-medium transition-colors duration-200 ${
                        theme === "dark"
                          ? "text-gray-400 xl:text-white"
                          : "text-black group-hover:text-white"
                      }`}
                    >
                      History
                    </span>
                  </button>
                </div>
              </div>
            </div>
            {/* Underline */}
            <div
              className={`w-full h-px xl:pl-5 ${
                theme === "dark" ? "bg-[#444048]" : "bg-[#DDDDDD]"
              }`}
            />
          </motion.div>

          {/* Dynamic Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="px-4"
          >
            <DynamicFeatures
              refreshBalance={() => {
                if (account?.address) {
                  fetchBalance(account.address);
                }
              }}
            />
            <div className="flex justify-center mt-6">
              {/* This space is intentionally left for spacing below the investments section */}
            </div>
          </motion.div>
        </div>

        {/* Holding Page Content - Only visible on xl screens */}
        <div
          className={`hidden xl:flex flex-col xl:w-2/6 xl:pr-5 xl:mt-[45px]
          }`}
        >
          <HoldingPage />
        </div>
      </div>

      {/* Modals */}
      {showModal === "deposit" && (
        <WalletDeposit isOpen={showModal === "deposit"} onClose={closeModal} />
      )}

      {showModal === "send" && (
        <SendModal isOpen={showModal === "send"} onClose={closeModal} />
      )}

      {showModal === "buy" && (
        <BuyModal isOpen={showModal === "buy"} onClose={closeModal} />
      )}

      {/* History panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </motion.div>
  );
}
