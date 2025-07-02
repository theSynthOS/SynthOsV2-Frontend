"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useConnect,
  ConnectButton,
} from "thirdweb/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { client, wallets } from "@/client";
import { scroll } from "thirdweb/chains";
import { getWalletBalance } from "thirdweb/wallets";
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
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConnectButtonDropdown, setShowConnectButtonDropdown] = useState(false);
  const [showModal, setShowModal] = useState<"deposit" | "send" | "buy" | null>(
    null
  );
  const [showFundsDropdown, setShowFundsDropdown] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<{
    USDC: string;
    USDT: string;
  }>({
    USDC: "0.00",
    USDT: "0.00",
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Update the mounted state and ensure theme is properly applied
  useEffect(() => {
    setMounted(true);
    // Force a re-render after mounting to ensure proper theme application
    const timer = setTimeout(() => {
      // This will trigger a re-render with the correct theme
      setMounted(state => state);
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
      fetchTokenBalances(account.address);
    } else {
      setDisplayAddress(null);
    }
  }, [account]);

  // Fetch token balances using ThirdWeb's getWalletBalance
  const fetchTokenBalances = async (address: string) => {
    if (!address) return;

    setIsLoadingBalances(true);
    try {
      // Fetch USDC balance
      const usdcBalance = await getWalletBalance({
        address,
        client,
        chain: scroll,
        tokenAddress: TOKENS.USDC.address,
      });

      // Fetch USDT balance
      const usdtBalance = await getWalletBalance({
        address,
        client,
        chain: scroll,
        tokenAddress: TOKENS.USDT.address,
      });

      setTokenBalances({
        USDC: usdcBalance
          ? parseFloat(usdcBalance.displayValue).toFixed(2)
          : "0.00",
        USDT: usdtBalance
          ? parseFloat(usdtBalance.displayValue).toFixed(2)
          : "0.00",
      });
    } catch (error) {
      toast.error("Failed to fetch token balances");
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const handleAuth = () => {
    if (account && wallet) {
      setDisplayAddress(null);
      disconnect(wallet);
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
    if (!showFundsDropdown && account?.address) {
      fetchTokenBalances(account.address);
    }
  };

  // Toggle wallet details dropdown
  const toggleWalletDetailsDropdown = () => {
    setShowConnectButtonDropdown(!showConnectButtonDropdown);
  };

  if (!isOpen) return null;
  if (!mounted) return null; // Don't render until mounted to avoid theme flashing

  // Panel content that remains the same regardless of theme
  const panelContent = (
    <div className="flex flex-col min-h-screen pt-6 text-black dark:text-white">
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
              {isLoadingBalances ? (
                <div className="py-2 text-center text-sm">
                  Loading balances...
                </div>
              ) : (
                <div className="space-y-3">
                  {/* USDC Balance */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-6 relative mr-2">
                        <Image
                          src={TOKENS.USDC.logoUrl}
                          alt="USDC"
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                      <span className="text-sm font-medium">USDC</span>
                    </div>
                    <span className="text-sm font-medium">
                      {tokenBalances.USDC}
                    </span>
                  </div>

                  {/* USDT Balance */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-6 relative mr-2">
                        <Image
                          src={TOKENS.USDT.logoUrl}
                          alt="USDT"
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                      <span className="text-sm font-medium">USDT</span>
                    </div>
                    <span className="text-sm font-medium">
                      {tokenBalances.USDT}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full">
          <button
            onClick={toggleWalletDetailsDropdown}
            className={`w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg text-black dark:text-white ${
              showConnectButtonDropdown ? "bg-white/5" : ""
            }`}
          >
            <div className="flex items-center">
              <Wallet
                className={`h-5 w-5 mr-3 ${
                  theme === "dark" ? "text-[#FFD659]" : "text-[#8266E6]"
                }`}
              />
              <span>Wallet Details</span>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-[#202020] dark:text-white transition-transform ${
                showConnectButtonDropdown ? "transform rotate-90" : ""
              }`}
            />
          </button>

          {/* Wallet Details Dropdown Content */}
          {showConnectButtonDropdown && (
            <div
              className={`mt-2 p-3 rounded-lg ${
                theme === "dark" ? "bg-[#FFFFFF]/5" : "bg-[#F9F9F9]"
              } text-black dark:text-white`}
            >
              {account ? (
                  <div className="">
                    <ConnectButton
                      client={client}
                      wallets={wallets}
                      theme={theme === "dark" ? "dark" : "light"}
                      connectModal={{ size: "compact" }}
                    />
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm mb-3 opacity-80">Connect your wallet to get started</p>
                  <ConnectButton
                    client={client}
                    wallets={wallets}
                    theme={theme === "dark" ? "dark" : "light"}
                    connectModal={{ size: "compact" }}
                  />
                </div>
              )}
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
          className={`fixed right-0 top-0 h-full w-full max-w-md transform transition-all duration-300 ease-out overflow-hidden`}
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
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
