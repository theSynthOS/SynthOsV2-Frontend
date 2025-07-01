import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { PayEmbed, useActiveAccount } from "thirdweb/react";
import { ToastContainer, toast } from "react-toastify";
import Card from "@/components/ui/card";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { client } from "@/client";
import { arbitrum, scroll } from "thirdweb/chains";
import { useBalance } from "@/contexts/BalanceContext";

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StablecoinType = "USDC" | "USDT";

// Token details for Scroll Mainnet
const TOKENS = {
  USDC: {
    address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", // Scroll Mainnet USDC address
    name: "USD Coin",
    symbol: "USDC",
    icon: "/usdc.png",
  },
  USDT: {
    address: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", // Scroll Mainnet USDT address
    name: "Tether USD",
    symbol: "USDT",
    icon: "/usdt.png",
  },
};

export default function BuyModal({ isOpen, onClose }: BuyModalProps) {
  const account = useActiveAccount();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<StablecoinType>("USDC");
  const { refreshBalance, refreshHoldings } = useBalance();

  // Set mounted state once hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  // If theme isn't loaded yet or modal not open, return null
  if (!mounted || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
        <Card title="Buy Crypto" onClose={onClose}>
          <div className="max-h-[60vh]">
            {!account ? (
              <div
                className={`${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                } rounded-lg p-4 text-center`}
              >
                <p
                  className={`${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  } mb-4`}
                >
                  Connect your wallet to buy crypto
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <PayEmbed
                  theme={theme === "dark" ? "dark" : "light"}
                  client={client}
                  payOptions={{
                    mode: "fund_wallet",
                    buyWithFiat: {
                      preferredProvider: "COINBASE",
                    },
                    prefillBuy: {
                      chain: scroll,
                      token: {
                        address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", // Scroll Mainnet USDC address
                        name: "USD Coin",
                        symbol: "USDC",
                        icon: "/usdc.png",
                      },
                    },
                    onPurchaseSuccess: () => {
                      // ONLY refresh after purchase completes - no polling
                      setTimeout(() => {
                        if (refreshBalance) {
                          refreshBalance();
                        }
                        if (refreshHoldings) {
                          refreshHoldings();
                        }
                      }, 2000); // Small delay for transaction to propagate
                    },
                    metadata: {
                      name: `Buy Crypto with Fiat`,
                    },
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
