import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import Card from "@/components/ui/card";
import { CreditCard, ArrowRight, ExternalLink, Wallet, AlertCircle } from "lucide-react";
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
  const { smartWalletAddress, isSmartWalletActive } = useSmartWallet();

  // IMPORTANT: Always use smart wallet address if available, never fallback to embedded wallet
  const walletAddress = smartWalletAddress;
  
  // Only consider account valid if we have a smart wallet address
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
      description: `Depositing to Smart Wallet`
    });
    console.log("Deposit started:", e);
    console.log("Deposit destination:", smartWalletAddress);
  };

  const handleDaimoPaymentCompleted = (e: any) => {
    toast.success("Deposit Completed", {
      description: `Funds have been added to your Smart Wallet`
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
            {!authenticated ? (
              <div className="text-center">
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
                
                {/* Daimo Pay Section */}
                <div className="space-y-4">
                  <div className="">
                   
                    <div className="flex items-center space-x-3 mb-4">   
                       {/* Display the destination address so users know where funds will go */}
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                      <p className="font-medium">We only accept USDT and USDC on this address</p>
                      <p className="font-medium">Please check properly the token before depositing</p>
                    </div>  
                      {account && (
                        <div className="flex-1">
                          {/* Wrap DaimoPayButton in an error boundary to prevent crashes */}
                          <div className="w-full">
                            <DaimoPayButton
                              appId={process.env.NEXT_PUBLIC_DAIMO_PAY_API || ''} 
                              toChain={currentToken.daimoToken.chainId}
                              toToken={getAddress(currentToken.daimoToken.token)}
                              toAddress={getAddress(smartWalletAddress!)}
                              intent="Deposit to Smart Wallet"
                              onDepositStarted={handleDaimoPaymentStarted}
                              onDepositCompleted={handleDaimoPaymentCompleted}
                            />
                          </div>
                        </div>
                      )}
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
