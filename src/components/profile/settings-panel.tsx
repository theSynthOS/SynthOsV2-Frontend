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
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useConnect,
} from "thirdweb/react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const router = useRouter();
  const { isAuthenticated, address, logout, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Sync ThirdWeb account with Auth Context
  useEffect(() => {
    // If ThirdWeb has an account but Auth Context doesn't, update Auth Context
    if (account?.address && !isAuthenticated) {
      login(account.address, wallet?.id);
    }
    // If Auth Context is authenticated but ThirdWeb has no account, update display from Auth Context
    else if (!account?.address && isAuthenticated && address) {
      setDisplayAddress(address);
    }
  }, [account, wallet, isAuthenticated, address, login]);

  // Update display address whenever account or auth address changes
  useEffect(() => {
    // Clear display address if not authenticated regardless of account
    if (!isAuthenticated) {
      setDisplayAddress(null);
      return;
    }

    if (account && account.address) {
      setDisplayAddress(account.address);
    } else if (address) {
      setDisplayAddress(address);
    } else {
      setDisplayAddress(null);
    }
  }, [account, address, isAuthenticated]);

  const handleAuth = () => {
    if (isAuthenticated) {
      setDisplayAddress(null);
      sessionStorage.removeItem("session_active");
      onClose();
      window.location.href = "/";
      logout();
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
        className={`fixed right-0 top-0 h-full w-full max-w-md transform transition-all duration-300 ease-out`}
        style={{
          animation: isExiting
            ? "slideOut 0.3s ease-out"
            : "slideIn 0.3s ease-out",
          borderRadius: "16px 0 0 16px",
          boxShadow:
            theme === "dark"
              ? "0 0 40px rgba(0, 0, 0, 0.3)"
              : "0 0 40px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          className={`flex flex-col min-h-screen ${
            theme === "dark" ? "bg-[#0f0b22] text-white" : "bg-white text-black"
          } pt-6`}
        >
          {/* Header */}
          <div className="px-4 pb-6 flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="w-8 h-8 flex items-center justify-center"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">Profile</h1>
            <div className="w-8 h-8"></div>
          </div>

          {/* User Info */}
          <div
            className={`px-4 pb-6 flex items-center border-b ${
              theme === "dark" ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full ${
                theme === "dark" ? "bg-gray-700" : "bg-gray-100"
              } flex items-center justify-center mr-4`}
            >
              <User
                className={`h-8 w-8 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </div>
            <div className="flex-1">
              <h2 className={`text-lg truncate font-semibold`}>
                {displayAddress
                  ? formatAddress(displayAddress)
                  : "Not connected"}
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

          {/* Menu Items */}
          <div className="px-4 py-4 space-y-4">
            <div
              className={`flex items-center justify-between p-3 ${
                theme === "dark" ? "bg-gray-800/50" : "bg-gray-100/50"
              } rounded-lg`}
            >
              <div className="flex items-center">
                {mounted && theme === "dark" ? (
                  <Moon
                    className={`h-5 w-5 mr-3 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                ) : (
                  <Sun
                    className={`h-5 w-5 mr-3 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                )}
                <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  theme === "dark" ? "bg-green-400" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === "dark" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <Link
              href="/holding"
              className={`flex items-center p-3 ${
                theme === "dark" ? "bg-gray-800/50" : "bg-gray-100/50"
              } rounded-lg hover:bg-opacity-80 transition-colors`}
              onClick={(e) => {
                e.preventDefault();
                setIsExiting(true);
                setTimeout(() => {
                  onClose();
                  setIsExiting(false);
                  router.push("/holding");
                }, 300);
              }}
            >
              <CreditCard
                className={`h-5 w-5 mr-3 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <span>View Funds</span>
            </Link>

            <button
              onClick={handleAuth}
              className={`w-full flex items-center p-3 ${
                theme === "dark" ? "bg-gray-800/50" : "bg-gray-100/50"
              } rounded-lg text-red-400`}
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>Log Out</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-3" />
                  <span>Log In</span>
                </>
              )}
            </button>
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
      </div>
    </div>
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
