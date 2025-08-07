import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import Card from "@/components/ui/card";
import { CreditCard, ArrowRight, ExternalLink } from "lucide-react";
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
  const { user, authenticated, getAccessToken, login } = usePrivy();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<StablecoinType>("USDC");
  const [isLoading, setIsLoading] = useState(false);
  const { refreshBalance, refreshHoldings } = useBalance();

  // Get wallet address from Privy user
  const account =
    authenticated && user?.wallet ? { address: user.wallet.address } : null;

  // Set mounted state once hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBuyCrypto = async (provider: "moonpay" | "transak" | "ramp") => {
    if (!account?.address) {
      toast.error("Wallet Not Connected", {
        description: "Please connect your wallet to buy crypto"
      });
      return;
    }

    setIsLoading(true);
    try {
      const walletAddress = account.address;
      const emailAddress = user?.email?.address;
      const currentUrl = window.location.href;
      const authToken = await getAccessToken();

      // Send request to backend to get on-ramp URL
      const response = await fetch("/api/onramp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          address: walletAddress,
          email: emailAddress,
          redirectUrl: currentUrl,
          provider: provider,
          token: selectedToken,
          tokenAddress: TOKENS[selectedToken].address,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get on-ramp URL");
      }

      const data = await response.json();
      const onrampUrl = data.url;

      if (!onrampUrl) {
        throw new Error("No on-ramp URL received");
      }

      // Open the on-ramp provider in a new window
      window.open(onrampUrl, "_blank", "width=500,height=700");

      toast.success("Opening Purchase Interface", {
        description: `Opening ${provider} to buy ${selectedToken}`
      });

      // Set up a listener for when the user returns (optional)
      const checkBalance = () => {
        setTimeout(() => {
          if (refreshBalance) {
            refreshBalance();
          }
          if (refreshHoldings) {
            refreshHoldings();
          }
        }, 5000); // Check after 5 seconds
      };

      checkBalance();
    } catch (error) {
      console.error("Error opening on-ramp:", error);
      toast.error("Purchase Interface Failed", {
        description: "Failed to open the purchase interface. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If theme isn't loaded yet or modal not open, return null
  if (!mounted || !isOpen) return null;

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
        <Card title="Buy Crypto" onClose={onClose}>
          <div className="max-h-[60vh] p-4">
            {!account ? (
              <div
                className={`${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                } rounded-lg p-6 text-center`}
              >
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p
                  className={`${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  } mb-4`}
                >
                  Connect your wallet to buy crypto
                </p>
                <button
                  onClick={login}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-[#8266E6] hover:bg-[#7255d5] text-white"
                      : "bg-[#8266E6] hover:bg-[#7255d5] text-white"
                  }`}
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Token Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Select Token
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(TOKENS).map(([key, token]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedToken(key as StablecoinType)}
                        className={`flex items-center p-3 rounded-lg border-2 transition-all ${
                          selectedToken === key
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <img
                          src={token.icon}
                          alt={token.name}
                          className="w-6 h-6 mr-2"
                        />
                        <span className="font-medium">{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* On-ramp Provider Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleBuyCrypto("moonpay")}
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      isLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Opening...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy with Moonpay
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleBuyCrypto("transak")}
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      isLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Opening...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy with Transak
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleBuyCrypto("ramp")}
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                      isLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-orange-600 hover:bg-orange-700 text-white"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Opening...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy with Ramp
                      </>
                    )}
                  </button>
                </div>

                {/* Info Section */}
                <div
                  className={`${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                  } rounded-lg p-4`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        i
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium mb-1">How it works:</p>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• Choose your preferred on-ramp provider</li>
                        <li>• Connect your bank account or card</li>
                        <li>
                          • Purchase {TOKENS[selectedToken].symbol} with fiat
                        </li>
                        <li>• Tokens are sent directly to your wallet</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Alternative Options */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Or buy from exchanges:
                  </p>
                  <div className="flex justify-center space-x-4">
                    <a
                      href="https://coinbase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Coinbase
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                    <a
                      href="https://binance.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Binance
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
