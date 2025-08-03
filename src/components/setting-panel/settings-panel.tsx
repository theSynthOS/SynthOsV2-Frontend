"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  User,
  Settings,
  LogOut,
  CreditCard,
  Bell,
  Shield,
  Info,
  MessageCircle,
  LogIn,
  Moon,
  Sun,
  Copy,
  Check,
  MoveDown,
  MoveUp,
  Send,
  ChevronRight,
  Plus,
  ChevronDown,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Link from "next/link";
import { useTheme } from "next-themes";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Token details for Scroll Mainnet
const TOKENS = {
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", // Scroll Mainnet USDC address
    logoUrl: "/usdc.png",
  },
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    address: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", // Scroll Mainnet USDT address
    logoUrl: "/usdt.png",
  },
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { user, logout, login } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConnectButtonDropdown, setShowConnectButtonDropdown] =
    useState(false);
  const [showModal, setShowModal] = useState<"deposit" | "send" | "buy" | null>(
    null
  );
  const [showFundsDropdown, setShowFundsDropdown] = useState(false);
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const lastFetchedAddress = useRef<string | null>(null);

  // Get the first wallet (embedded wallet) if available
  const wallet = wallets[0];
  const account = wallet ? { address: wallet.address } : null;

  // Update the mounted state and ensure theme is properly applied
  useEffect(() => {
    setMounted(true);
    // Force a re-render after mounting to ensure proper theme application
    const timer = setTimeout(() => {
      // This will trigger a re-render with the correct theme
      setMounted((state) => state);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

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
      // Only fetch balance if we haven't fetched for this address yet
      if (lastFetchedAddress.current !== account.address) {
        fetchTotalBalance(account.address);
        lastFetchedAddress.current = account.address;
      }
    } else {
      setDisplayAddress(null);
      setTotalBalance("0.00"); // Reset balance when no account
      lastFetchedAddress.current = null;
    }
  }, [account?.address]); // Only depend on the address, not the entire account object

  // Fetch total balance like the main page
  const fetchTotalBalance = async (address: string) => {
    if (!address) return;

    setIsLoadingBalances(true);
    try {
      // Fetch total balance from the same API endpoint used by the main page
      const response = await fetch(`/api/balance?address=${address}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Failed to fetch total balance, using fallback value");
        setTotalBalance("0.00");
        return;
      }

      const data = await response.json();
      console.log("Total balance response:", data);

      // Extract total balance from response
      const balance = data.balance || data.total || "0.00";
      setTotalBalance(balance);
    } catch (error) {
      console.error("Failed to fetch total balance:", error);
      toast.error("Failed to fetch balance");
      // Set fallback value
      setTotalBalance("0.00");
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const handleAuth = async () => {
    if (user && wallet) {
      setDisplayAddress(null);
      await logout();
      onClose();
      window.location.href = "/";
    } else {
      handleGoBack();
    }
  };

  const handleGoBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  // Handle copy address to clipboard
  const handleCopyAddress = () => {
    if (displayAddress) {
      navigator.clipboard
        .writeText(displayAddress)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.info("Wallet address copied to clipboard");
        })
        .catch(() => {});
    }
  };

  // Handle opening modals
  const handleOpenModal = (modalType: "deposit" | "send" | "buy") => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
      router.push(`/home?modal=${modalType}`);
    }, 300);
  };

  // Toggle funds dropdown
  const toggleFundsDropdown = () => {
    setShowFundsDropdown(!showFundsDropdown);
    // Only fetch balance if dropdown is opening and we haven't fetched for this address yet
    if (
      !showFundsDropdown &&
      account?.address &&
      lastFetchedAddress.current !== account.address
    ) {
      fetchTotalBalance(account.address);
      lastFetchedAddress.current = account.address;
    }
  };

  // Toggle wallet details dropdown
  // const toggleWalletDetailsDropdown = () => {
  //   setShowConnectButtonDropdown(!showConnectButtonDropdown);
  // };

  if (!isOpen) return null;
  if (!mounted) return null; // Don't render until mounted to avoid theme flashing

  // Panel content that remains the same regardless of theme
  const panelContent = (
    <div className="flex flex-col min-h-screen pb-28 xl:pb-0 pt-6 text-black dark:text-white">
      {/* Header */}
      <div className="px-4 pb-6 flex items-center justify-between">
        <button
          onClick={handleGoBack}
          className="w-8 h-8 flex items-center justify-center text-black dark:text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl uppercase tracking-widest text-[#8266E6] dark:text-white">
          Setting
        </h1>
        <div className="w-8 h-8"></div>
      </div>

      {/* User Info */}
      <div className={`px-4 pb-6 flex items-center`}>
        <div className="flex-1">
          <h2
            className={`text-lg truncate font-semibold text-black dark:text-white`}
          >
            {displayAddress ? formatAddress(displayAddress) : "Not connected"}
          </h2>
          {displayAddress && (
            <div className="flex items-center mt-1">
              <button
                onClick={handleCopyAddress}
                className={`flex items-center text-sm ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                } transition-colors`}
                aria-label="Copy wallet address"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    <span>Copy address</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="px-4">
        <div className="h-px w-full bg-[#DDDDDD] dark:bg-[#444048]" />
      </div>
      {/* Menu Items */}
      <div className="px-4 py-4 space-y-4">
        {/* Deposit */}
        <button
          onClick={() => handleOpenModal("deposit")}
          className={`w-full flex items-center p-3 border border-white/40 ${
            theme === "dark" ? "bg-[#FFFFFF]/5" : "bg-[#FDFDFF]"
          } rounded-lg hover:bg-opacity-80 transition-colors text-black dark:text-white`}
        >
          <MoveDown
            className={`h-5 w-5 mr-3 transform rotate-45 ${
              theme === "dark" ? "text-[#FFD659]" : "text-[#8266E6]"
            }`}
          />
          <span>Deposit</span>
        </button>

        {/* Send */}
        <button
          onClick={() => handleOpenModal("send")}
          className={`w-full flex items-center p-3 border border-white/60 ${
            theme === "dark" ? "bg-[#FFFFFF]/5" : "bg-[#FDFDFF]"
          } rounded-lg hover:bg-opacity-80 transition-colors text-black dark:text-white`}
        >
          <MoveUp
            className={`h-5 w-5 mr-3 transform -rotate-45 ${
              theme === "dark" ? "text-[#FFD659]" : "text-[#8266E6]"
            }`}
          />
          <span>Send</span>
        </button>

        {/* Buy */}
        <button
          onClick={() => handleOpenModal("buy")}
          className={`w-full flex items-center p-3 border border-white/60 ${
            theme === "dark" ? "bg-[#FFFFFF]/5" : "bg-[#FDFDFF]"
          } rounded-lg hover:bg-opacity-80 transition-colors text-black dark:text-white`}
        >
          <Plus
            className={`h-5 w-5 mr-3 ${
              theme === "dark" ? "text-[#FFD659]" : "text-[#8266E6]"
            }`}
          />
          <span>Buy</span>
        </button>

        {/* View Funds with Dropdown */}
        <div className="w-full">
          <button
            onClick={toggleFundsDropdown}
            className={`w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg text-black dark:text-white ${
              showFundsDropdown ? "bg-white/5" : ""
            }`}
          >
            <div className="flex items-center">
              <CreditCard
                className={`h-5 w-5 mr-3 ${
                  theme === "dark" ? "text-[#FFD659]" : "text-[#8266E6]"
                }`}
              />
              <span>View Funds</span>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-[#202020] dark:text-white transition-transform ${
                showFundsDropdown ? "transform rotate-90" : ""
              }`}
            />
          </button>

          {/* Dropdown Content */}
          {showFundsDropdown && (
            <div
              className={`mt-2 p-3 rounded-lg ${
                theme === "dark" ? "bg-[#FFFFFF]/5" : "bg-[#F9F9F9]"
              } text-black dark:text-white`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-2xl font-bold text-[#8266E6] dark:text-[#FFD659]">
                    ${totalBalance}
                  </div>
                  <button
                    onClick={() =>
                      account?.address && fetchTotalBalance(account.address)
                    }
                    disabled={isLoadingBalances}
                    className={`p-1 rounded-full transition-colors ${
                      isLoadingBalances
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    aria-label="Refresh balance"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isLoadingBalances ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isLoadingBalances ? "Updating..." : "Total Balance"}
                </div>
              </div>
            </div>
          )}
        </div>

        {account ? (
          <button
            onClick={handleAuth}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg text-red-400"
          >
            <div className="flex items-center">
              <LogOut className="h-5 w-5 mr-3" />
              <span>Log Out</span>
            </div>
            <ChevronRight className="h-5 w-5 text-[#202020] dark:text-white" />
          </button>
        ) : (
          <></>
        )}
      </div>

      <div
        className={`mt-auto p-4 text-center text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <p>SynthOS</p>
        <p>© 2025 SynthOS. All rights reserved.</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50">
        {/* Semi-transparent backdrop */}
        <div
          className={`fixed inset-0 ${
            theme === "dark" ? "bg-black/40" : "bg-gray-900/30"
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
          className={`fixed right-0 top-0 h-full w-full max-w-md transform transition-all duration-300 ease-out overflow-y-auto scrollbar-hide`}
          style={{
            animation: isExiting
              ? "slideOut 0.3s ease-out"
              : "slideIn 0.3s ease-out",
            borderRadius: "16px 0 0 16px",
            boxShadow:
              theme === "dark"
                ? "0 0 40px rgba(0, 0, 0, 0.3)"
                : "0 0 40px rgba(0, 0, 0, 0.1)",
            ...(theme === "dark" && {
              background:
                "linear-gradient(311.14deg, rgba(11, 4, 36, 0.4) 16.15%, rgba(60, 34, 156, 0.4) 94.41%)",
              backdropFilter: "blur(90px)",
            }),
          }}
        >
          {theme === "dark" ? (
            panelContent
          ) : (
            <BackgroundGradientAnimation>
              {panelContent}
            </BackgroundGradientAnimation>
          )}
        </div>
      </div>
    </>
  );
}

const styles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
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

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
