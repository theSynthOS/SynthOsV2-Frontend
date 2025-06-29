"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { MoveUp, MoveDown, Send, Copy, Check } from "lucide-react";
import WalletDeposit from "@/components/features/wallet-deposit";
import SendModal from "@/components/features/wallet-send";
import BuyModal from "@/components/features/wallet-buy";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client } from "@/client";
import { useTheme } from "next-themes";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import HoldingCard from "@/components/ui/holding-card";
import { useIsMobile } from "@/hooks/use-mobile";

type Holding = {
  protocolName: string;
  pairName: string;
  currentAmount: number;
  initialAmount: number;
  pnl: number;
  apy: number;
  status: string;
  protocolLogo: string;
};

export default function HoldingPage() {
  const account = useActiveAccount();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const router = useRouter();
  const controls = useAnimation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  // Set mounted to true on initial load to enable theme rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update display address whenever account changes
  useEffect(() => {
    if (account?.address) {
      setDisplayAddress(account.address);
    } else {
      setDisplayAddress(null);
    }
  }, [account]);

  // Fetch holdings data
  useEffect(() => {
    if (!account?.address) return;
    setIsLoading(true);
    fetch(`/accounts/holdings/${account.address}`)
      .then((res) => res.json())
      .then((data) => {
        setHoldings(Array.isArray(data) ? data : []);
        console.log("Fetched holdings:", data);
      })
      .catch(() => setHoldings([]))
      .finally(() => setIsLoading(false));
  }, [account?.address]);

  // Calculate total holding and pnl
  const totalHolding = holdings.reduce(
    (sum, h) => sum + (h.currentAmount || 0),
    0
  );
  const totalPnl = holdings.reduce((sum, h) => sum + (h.pnl || 0), 0);

  // Format PnL
  const pnlColor =
    totalPnl > 0
      ? "text-green-500"
      : totalPnl < 0
      ? "text-red-500"
      : "text-gray-500";
  const pnlSign = totalPnl > 0 ? "+" : totalPnl < 0 ? "-" : "";

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 6
    )}`;
  };

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

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100; // minimum distance to trigger navigation
    if (info.offset.x > threshold) {
      router.replace("/home");
    } else {
      controls.start({ x: 0 });
    }
  };

  // Reset animation state when component mounts or updates
  useEffect(() => {
    controls.set({ x: 0 });
  }, [controls]);

  // If theme isn't loaded yet, render nothing to avoid flash
  if (!mounted) return null;

  return (
    <motion.div
      {...(isMobile
        ? {
            drag: "x",
            dragConstraints: { left: 0, right: 0 },
            dragElastic: 0.2,
            onDragEnd: handleDragEnd,
            whileDrag: { cursor: "grabbing" },
          }
        : {})}
      animate={controls}
      initial={{ x: 0 }}
      className={`flex flex-col bg-transparent ${
        theme === "dark" ? "text-white" : "text-black"
      } p-4 xl:p-0`}
    >
      {/* Section 1: User Profile */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={`${
            theme === "dark" ? "bg-[#1E1E1E]/80" : "bg-[#FFFFFF]/65 shadow-sm"
          } rounded-2xl p-5 mb-3`}
        >
          {/* Total holding value */}
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col items-start">
              <span
                className={`text-sm xl:text-lg tracking-widest font-medium ${
                  theme === "dark" ? "text-[#727272]" : "text-[#A1A1A1]"
                }`}
              >
                Total Holding Value
              </span>
              <div className="my-2">
                <span
                  className={`text-3xl font-bold xl:font-medium xl:text-5xl ${
                    theme === "dark"
                      ? "text-white xl:text-[#FFCA59] xl:drop-shadow-[0_0_12px_rgba(255,202,89,0.5)]"
                      : "text-black"
                  }`}
                  style={{
                    fontFamily: "var(--font-tt-travels), sans-serif",
                  }}
                >
                  ${totalHolding.toFixed(2)}
                </span>
                {/* pnl */}
                <span
                  className={`text-sm xl:text-lg tracking-widest font-medium px-2 ${pnlColor}`}
                >
                  {pnlSign}${Math.abs(totalPnl).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start">
            {/* Wallet Address */}
            <div
              className={`text-sm ${
                theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
              } flex items-center`}
            >
              <span>
                {displayAddress
                  ? formatAddress(displayAddress)
                  : "Wallet not connected"}
              </span>

              {displayAddress && (
                <button
                  onClick={handleCopyAddress}
                  className={`ml-2 p-1 rounded-full transition-colors ${
                    theme === "dark"
                      ? "hover:bg-gray-700/70"
                      : "hover:bg-gray-100"
                  }`}
                  aria-label="Copy address to clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 2: Holdings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={`${
            theme === "dark" ? "bg-[#1E1E1E]/80" : "bg-[#FFFFFF]/65 shadow-sm"
          } rounded-2xl p-5 mb-3`}
        >
          <div className="flex flex-col items-center">
            <div className="flex justify-between items-center w-full text-sm xl:text-lg mb-4">
              <span
                className={`tracking-widest font-medium ${
                  theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                }`}
              >
                YOUR HOLDINGS
              </span>

              <div
                className={`flex items-center gap-1 underline ${
                  theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                }`}
              >
                <span className="tracking-widest font-medium">View All</span>
                <ArrowRight size={16} />
              </div>
            </div>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              holdings.map((h, idx) => (
                <HoldingCard
                  key={idx}
                  symbol={h.pairName}
                  name={h.protocolName}
                  amount={h.currentAmount.toString()}
                  apy={h.apy.toString()}
                  logoUrl={h.protocolLogo}
                  onClick={() => {}}
                />
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
