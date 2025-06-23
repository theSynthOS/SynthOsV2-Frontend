"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import DynamicFeatures from "@/components/home/dynamic-features";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react";
import { Skeleton } from "@/components/ui/skeleton";
import { MoveUp, MoveDown, Send } from "lucide-react";
import { usePoints } from "@/contexts/PointsContext";
import SendModal from "@/components/features/wallet-send";
import BuyModal from "@/components/features/wallet-buy";
import WalletDeposit from "@/components/features/wallet-deposit";

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const { refreshPoints } = usePoints();
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const account = useActiveAccount();
  const [showModal, setShowModal] = useState<"deposit" | "send" | "buy" | null>(
    null
  );

  const fetchBalance = async (walletAddress: string) => {
    try {
      setIsLoadingBalance(true);
      const response = await fetch(`/api/balance?address=${walletAddress}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      const data = await response.json();
      setBalance(data.usdBalance || "0.00");
      // Refresh points after balance update
      refreshPoints();
      return data.usdBalance || "0.00";
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.00");
      return "0.00";
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(null);
  };

  // Show loading state while checking authentication
  if (!account?.address) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1, opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={`text-xl ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          Loading...
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <div className="flex flex-col min-h-screen">


        {/* Balance */}
        <motion.div
          className="w-full flex justify-center mt-[0px] px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div
            className={`${
              theme === "dark" ? "bg-[#1E1E1ECC]" : "bg-[#FFFFFFA6]"
            } rounded-t-2xl px-4 pt-6 w-full text-center relative overflow-hidden`}
          >
            {theme === "dark" && (
              <div
                className="absolute -top-28 -left-26 w-96 h-96 rounded-full opacity-[50%] z-0"
                style={{
                  background: "#3C229C80",
                  filter: "blur(40px)",
                }}
              />
            )}
            <div className="relative z-10">
              <div className="text-xs tracking-widest text-[#727272] font-light mb-2">
                TOTAL BALANCE
              </div>
              <div
                className={`py-6 font-medium text-4xl leading-[100%] tracking-[-0.03em] text-center uppercase ${
                  theme === "dark" ? "text-[#FFCA59]" : "text-gray-900"
                }`}
                style={
                  theme === "dark"
                    ? { textShadow: "0px 0px 12px #FFCA5980" }
                    : {}
                }
              >
                {isLoadingBalance ? (
                  <Skeleton className="w-32 h-7 rounded-sm bg-gray-300 dark:bg-gray-800 mx-auto" />
                ) : (
                  `$${balance}`
                )}
              </div>
              {/* Action Buttons-- originally justify-between */}
              <div className="flex justify-between w-full max-w-xs mx-auto p-4">
                <button
                  onClick={() => setShowModal("deposit")}
                  className="flex flex-col items-center group"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 border transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-[#FFFFFF0D] border-[#402D86B2] group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] group-hover:border-[#8266E6]"
                        : "bg-[#FFFFFFA6] border-[#DDDDDD] group-hover:bg-[#8266E6] group-hover:border-[#8266E6]"
                    }`}
                  >
                    <MoveDown
                      size={15}
                      className={`transform rotate-45 transition-colors duration-200 ${
                        theme === "dark" ? "text-white" : "text-[#8266E6]"
                      } group-hover:text-white`}
                    />
                  </div>
                  <span className="text-sm font-medium">Deposit</span>
                </button>

                <button
                  onClick={() => setShowModal("send")}
                  className="flex flex-col items-center group"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 border transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-[#FFFFFF0D] border-[#402D86B2] group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] group-hover:border-[#8266E6]"
                        : "bg-[#FFFFFFA6] border-[#DDDDDD] group-hover:bg-[#8266E6] group-hover:border-[#8266E6]"
                    }`}
                  >
                    <MoveUp
                      size={15}
                      className={`transform -rotate-45 transition-colors duration-200 ${
                        theme === "dark" ? "text-white" : "text-[#8266E6]"
                      } group-hover:text-white`}
                    />
                  </div>
                  <span className="text-sm font-medium">Send</span>
                </button>

                <button
                  onClick={() => setShowModal("buy")}
                  className="flex flex-col items-center group"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 border transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-[#FFFFFF0D] border-[#402D86B2] group-hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] group-hover:border-transparent"
                        : "bg-[#FFFFFFA6] border-[#DDDDDD] group-hover:bg-[#8266E6] group-hover:border-transparent"
                    }`}
                  >
                    <Send
                      size={15}
                      className={`transition-colors duration-200 ${
                        theme === "dark" ? "text-white" : "text-[#8266E6]"
                      } group-hover:text-white`}
                    />
                  </div>
                  <span className="text-sm font-medium">Buy</span>
                </button>
              </div>
              <div className="h-px w-full bg-gray-200 dark:bg-[#444048]" />
            </div>
          </div>
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
    </motion.div>
  );
}
