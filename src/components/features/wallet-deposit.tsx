import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import QRCode from "react-qr-code";
import { useTheme } from "next-themes";
import Image from "next/image";
import Card from "@/components/ui/card";
import { mediumHaptic, copyHaptic } from "@/lib/haptic-utils";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StablecoinType = "USDC" | "USDT";

export default function WalletDeposit({ isOpen, onClose }: DepositModalProps) {
  const { user, authenticated } = usePrivy();
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);
  const account = authenticated && user?.wallet ? { address: user.wallet.address } : null;
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<StablecoinType>("USDC");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set mounted state once hydration is complete and detect mobile
  useEffect(() => {
    setMounted(true);

    // Check if the device is mobile and update window height
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setWindowHeight(window.innerHeight);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Determine which address to display - use ThirdWeb account
  useEffect(() => {
    if (account?.address) {
      setDisplayAddress(account.address);
    }
  }, [account]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal close
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const selectCoin = (coin: StablecoinType, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event propagation
    setSelectedCoin(coin);
    setDropdownOpen(false);
  };

  // If theme isn't loaded yet or modal not open, return nothing
  if (!mounted || !isOpen) return null;

  // Calculate dynamic styles based on device height
  const isSmallHeight = windowHeight < 700;
  const contentPadding = isMobile ? (isSmallHeight ? "p-3" : "p-4") : "p-6";
  const qrSize = isMobile ? (isSmallHeight ? 130 : 150) : 180;

  // Calculate logo size based on QR code size
  const logoSize = Math.floor(qrSize * 0.4);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
      ></div>

      {/* Card Content */}
      <div
        className="relative z-10 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card title="Deposit Funds" onClose={onClose}>
          <div className="">
            {!displayAddress ? (
              <div
                className={`${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                } rounded-lg ${contentPadding} text-center`}
              >
                <p
                  className={`${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  } ${isMobile ? "text-sm mb-3" : "mb-4"}`}
                >
                  Connect your wallet to get your deposit address
                </p>
              </div>
            ) : (
              <div className={`space-y-${isSmallHeight ? "3" : "4"}`}>
                {/* Stablecoin Selector */}
                <div className="relative w-full mb-4" ref={dropdownRef}>
                  <div
                    className={`flex items-center justify-between ${
                      theme === "dark"
                        ? "bg-white/5 border-white/40"
                        : "bg-white/50 border-gray-200"
                    } border rounded-lg p-3 cursor-pointer`}
                    onClick={toggleDropdown}
                  >
                    <div className="flex items-center">
                      <Image
                        src={`/${selectedCoin.toLowerCase()}.png`}
                        alt={`${selectedCoin} Logo`}
                        width={24}
                        height={24}
                        className="mr-2"
                      />
                      <span
                        className={`uppercase ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {selectedCoin}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      } transition-transform ${
                        dropdownOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      className={`absolute mt-1 w-full rounded-md shadow-lg z-10 ${
                        theme === "dark"
                          ? "bg-[#321b87] border-gray-700"
                          : "bg-white border-gray-200"
                      } border`}
                    >
                      <div className="py-1">
                        <button
                          className={`flex items-center w-full px-4 py-2 text-left cursor-pointer ${
                            selectedCoin === "USDC"
                              ? theme === "dark"
                                ? "bg-[#14054e]"
                                : "bg-gray-100"
                              : ""
                          } ${
                            theme === "dark"
                              ? "hover:bg-[#494385]"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={(e) => {
                            mediumHaptic();
                            selectCoin("USDC", e);
                          }}
                        >
                          <Image
                            src="/usdc.png"
                            alt="USDC Logo"
                            width={20}
                            height={20}
                            className="mr-2"
                          />
                          <span
                            className={
                              theme === "dark" ? "text-white" : "text-gray-800"
                            }
                          >
                            USDC
                          </span>
                        </button>
                        <button
                          className={`flex items-center w-full px-4 py-2 text-left cursor-pointer ${
                            selectedCoin === "USDT"
                              ? theme === "dark"
                                ? "bg-[#14054e]"
                                : "bg-gray-100"
                              : ""
                          } ${
                            theme === "dark"
                              ? "hover:bg-[#494385]"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={(e) => {
                            mediumHaptic();
                            selectCoin("USDT", e);
                          }}
                        >
                          <Image
                            src="/usdt.png"
                            alt="USDT Logo"
                            width={20}
                            height={20}
                            className="mr-2"
                          />
                          <span
                            className={
                              theme === "dark" ? "text-white" : "text-gray-800"
                            }
                          >
                            USDT
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Address Section */}
                <div>
                  {/* QR Code with Logo Overlay */}
                  <div className="flex justify-center mb-3">
                    {displayAddress ? (
                      <div
                        className={`'bg-transparent' ${
                          isMobile ? "p-2" : "p-3"
                        } rounded-lg relative`}
                      >
                        <QRCode
                          value={displayAddress}
                          size={qrSize}
                          level="H" // Use high error correction to allow for logo placement
                          className="mx-auto"
                          bgColor="transparent"
                          fgColor={theme === "dark" ? "#FFFFFF" : "#000000"}
                          style={{
                            shapeRendering: "crispEdges",
                          }}
                        />
                        {/* Logo Overlay */}
                        <div
                          className="absolute"
                          style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: `${logoSize}px`,
                            height: `${logoSize}px`,
                            background: theme === "dark" ? "#1F2937" : "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            padding: "0.8px",
                            border: `3px solid ${
                              theme === "dark" ? "#FFFFFF" : "#000000"
                            }`,
                          }}
                        >
                          <Image
                            src={`/${selectedCoin.toLowerCase()}.png`}
                            alt={`${selectedCoin} Logo`}
                            width={logoSize}
                            height={logoSize}
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`w-[${qrSize}px] h-[${qrSize}px] ${
                          theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                        } rounded-lg flex items-center justify-center`}
                      >
                        <span
                          className={`${
                            theme === "dark" ? "text-gray-500" : "text-gray-400"
                          } ${isMobile ? "text-xs" : "text-sm"}`}
                        >
                          No address available
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-center p-4 ${
                      isMobile ? "text-xs" : "text-sm"
                    } ${theme === "dark" ? "text-[#747474]" : "text-gray-500"}`}
                  >
                    Scan this QR code to get your address
                  </div>

                  <div
                    className={`flex items-start justify-between ${
                      theme === "dark"
                        ? "bg-white/5 border-white/40"
                        : "bg-white border-gray-200"
                    } border rounded-lg ${isMobile ? "p-2" : "p-3"} mb-4`}
                  >
                    <div
                      className={`font-mono items-center ${
                        isMobile ? "text-xs" : "text-sm"
                      } break-all flex-1 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {displayAddress || "Please connect your wallet"}
                    </div>
                    <button
                      onClick={(e) => {
                        copyHaptic();
                        copyToClipboard(e);
                      }}
                      className={`ml-2 ${
                        isMobile ? "p-1" : "p-1.5"
                      } rounded-full ${
                        theme === "dark"
                          ? "hover:bg-gray-500"
                          : "hover:bg-gray-100"
                      } transition-colors flex-shrink-0`}
                      disabled={!displayAddress}
                    >
                      {copied ? (
                        <Check
                          className={`${
                            isMobile ? "h-4 w-4" : "h-5 w-5"
                          } text-green-500`}
                        />
                      ) : (
                        <Copy
                          className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Network Information */}
                <div className="pb-2">
                  <h3
                    className={`font-medium mb-2 ${isMobile ? "text-sm" : ""}`}
                  >
                    {" "}
                    ❗️ Important Information
                  </h3>
                  <ul
                    className={`${isMobile ? "text-xs" : "text-sm"} ${
                      theme === "dark" ? "text-[#747474]" : "text-gray-500"
                    } space-y-1 `}
                  >
                    <li>
                      • Only send assets on the{" "}
                      <span className="text-red-500 dark:text-red-400">
                        Scroll Mainnet
                      </span>
                    </li>
                    <li>• We only accept USDT and USDC on this address</li>
                    <li>• Transactions may take a few minutes to confirm</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
