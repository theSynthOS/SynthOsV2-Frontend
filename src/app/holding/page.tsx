"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { MoveUp, MoveDown, Send, Copy, Check } from "lucide-react";
import DepositModal from "@/components/features/wallet-deposit";
import WithdrawModal from "@/components/features/wallet-withdraw";
import SendModal from "@/components/features/wallet-send";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client } from "@/client";
import { useTheme } from "next-themes";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function HoldingPage() {
  const account = useActiveAccount();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const router = useRouter();
  const controls = useAnimation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ x: 0 }}
      whileDrag={{ cursor: "grabbing" }}
      className={`flex flex-col min-h-screen ${
        theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-[#f0eef9] text-black"
      } p-4`}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Section 1: User Profile */}
        <div
          className={`${
            theme === "dark" ? "bg-[#1E1E1E]/80" : "bg-[#FFFFFF]/65 shadow-sm"
          } rounded-2xl p-5 mb-3`}
        >
          {/* Total holding value */}
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col items-start">

              <span className={`text-sm tracking-widest font-medium ${
                theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
              }`}>Total Holding Value</span>

              <span className={`text-xl font-bold my-2 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}>0.00</span> 

            </div>
          </div>

          <div className="flex flex-col items-start">
            {/* Wallet Address */}
            <div
              className={`text-sm  ${
                theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
              } flex items-center`}
            >
              <span>{displayAddress
                ? formatAddress(displayAddress)
                : "Wallet not connected"}</span>
              
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
            <div className="flex justify-between items-center w-full text-sm">
              <span className={`tracking-widest font-medium ${
                theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
              }`}>YOUR HOLDINGS</span>

              <div className={`flex items-center gap-1 underline ${
                theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
              }`}>
                <span className="tracking-widest font-medium ">View All</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
