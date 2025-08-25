import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import Card from "@/components/ui/card";
import { CreditCard, ArrowRight, ExternalLink, Wallet } from "lucide-react";
import { useBalance } from "@/contexts/BalanceContext";
import { DaimoPayButton } from "@daimo/pay";
import { scrollUSDC, scrollUSDT } from "@daimo/pay-common";
import { getAddress } from "viem";
import { useSmartWallet } from "@/contexts/SmartWalletContext";

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
    daimoToken: scrollUSDC,
  },
  USDT: {
    address: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", // Scroll Mainnet USDT address
    name: "Tether USD",
    symbol: "USDT",
    icon: "/usdt.png",
    daimoToken: scrollUSDT,
  },
};

export default function BuyModal({ isOpen, onClose }: BuyModalProps) {
  const { user, authenticated, getAccessToken, login } = usePrivy();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [daimoAmount, setDaimoAmount] = useState(""); // Default amount for Daimo Pay
  const [selectedToken, setSelectedToken] = useState<StablecoinType>("USDC");
  const { refreshBalance, refreshHoldings } = useBalance();
  const { smartWalletAddress } = useSmartWallet();

  // Get wallet address from Privy user - prioritize smart wallet address if available
  const walletAddress = smartWalletAddress || user?.wallet?.address;
  const account = authenticated && walletAddress ? { address: walletAddress } : null;

  // Set mounted state once hydration is complete
  useEffect(() => {
    setMounted(true);
    
    // Log wallet addresses for debugging
    if (authenticated) {
      console.log("Smart Wallet Address:", smartWalletAddress);
      console.log("Embedded Wallet Address:", user?.wallet?.address);
      console.log("Using Address for Deposit:", walletAddress);
    }
  }, [authenticated, smartWalletAddress, user?.wallet?.address, walletAddress]);

  const handleDaimoPaymentStarted = (e: any) => {
    toast.info("Deposit Started", {
      description: `Depositing to ${account?.address?.substring(0, 8)}...${account?.address?.substring(account?.address.length - 6)}`
    });
    console.log("Deposit started:", e);
    console.log("Deposit destination:", account?.address);
  };

  const handleDaimoPaymentCompleted = (e: any) => {
    toast.success("Deposit Completed", {
      description: `Funds have been added to ${account?.address?.substring(0, 8)}...${account?.address?.substring(account?.address.length - 6)}`
    });
    console.log("Deposit completed:", e);
    
    // Refresh balances after deposit
    if (refreshBalance) {
      refreshBalance();
    }
    if (refreshHoldings) {
      refreshHoldings();
    }
  };

  // If theme isn't loaded yet or modal not open, return null
  if (!mounted || !isOpen) return null;

  // Get the current selected token details
  const currentToken = TOKENS[selectedToken];

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
                    Select Token to Deposit
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
                  
                {/* Daimo Pay Section */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 p-4 rounded-lg">
                   
                    <div className="flex items-center space-x-3 mb-4">     
                      {account && (
                        <div className="flex-1">
                          {/* Wrap DaimoPayButton in an error boundary to prevent crashes */}
                          <div className="w-full">
                            <DaimoPayButton
                              appId={process.env.NEXT_PUBLIC_DAIMO_PAY_API || ''} // Use your actual app ID in production
                              toChain={currentToken.daimoToken.chainId} // Use the selected token's chain ID
                              toToken={getAddress(currentToken.daimoToken.token)}
                              toAddress={getAddress(account.address)}
                              intent="Deposit"
                              onDepositStarted={handleDaimoPaymentStarted}
                              onDepositCompleted={handleDaimoPaymentCompleted}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Display the destination address so users know where funds will go */}
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                      <p>{smartWalletAddress ? "Funds will be deposited to your smart wallet:" : "Funds will be deposited to your wallet:"}</p>
                      <p className="font-mono mt-1 truncate">{account?.address}</p>
                    </div>
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
