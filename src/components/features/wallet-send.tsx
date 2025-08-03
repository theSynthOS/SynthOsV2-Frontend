import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePrivy, useSendTransaction } from "@privy-io/react-auth";
import Card from "@/components/ui/card";
import Image from "next/image";
import { parseUnits, formatUnits } from "viem";
import { ChevronDown } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { safeHaptic, mediumHaptic, heavyHaptic } from "@/lib/haptic-utils";
import { useBalance } from "@/contexts/BalanceContext";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TokenType = "USDC" | "USDT";

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

export default function SendModal({ isOpen, onClose }: SendModalProps) {
  const { theme } = useTheme();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const { user, authenticated, login } = usePrivy();
  const [balance, setBalance] = useState("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenType>("USDC");
  const { refreshBalance, refreshHoldings } = useBalance();

  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const { sendTransaction } = useSendTransaction();

  // Get wallet address from Privy user
  const account =
    authenticated && user?.wallet ? { address: user.wallet.address } : null;

  // Toggle between USDC and USDT
  const toggleToken = () => {
    const newToken = selectedToken === "USDC" ? "USDT" : "USDC";
    setSelectedToken(newToken);
    setAmount("");
    fetchTokenBalance(newToken);
  };

  // Fetch token balance when account or selected token changes
  useEffect(() => {
    if (account?.address) {
      fetchTokenBalance(selectedToken);
    }
  }, [account, selectedToken]);

  // Function to fetch token balance directly from Privy API
  const fetchTokenBalance = async (tokenType: TokenType = selectedToken) => {
    if (!account?.address) return;

    setIsLoadingBalance(true);
    try {
      // Get wallet ID from Privy user
      const walletId = user?.wallet?.id || user?.wallet?.address;
      
      if (!walletId) {
        console.warn("No wallet ID available");
        setBalance("0.00");
        return;
      }

      // Call Privy API directly
      const response = await fetch(`https://api.privy.io/v1/wallets/${walletId}/balance?asset=${tokenType.toLowerCase()}&chain=scroll`, {
        headers: {
          "Authorization": `Basic ${btoa(`${process.env.NEXT_PUBLIC_PRIVY_APP_ID}:${process.env.NEXT_PUBLIC_PRIVY_APP_SECRET}`)}`,
          "privy-app-id": process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""
        }
      });
      
      if (!response.ok) {
        console.warn(`Privy API error: ${response.status}`);
        setBalance("0.00");
        return;
      }
      
      const data = await response.json();
      const balance = data.balances?.[0]?.display_values?.[tokenType.toLowerCase()] ?? "0.00";
      setBalance(balance);
    } catch (error) {
      console.error(`Failed to fetch ${tokenType} balance:`, error);
      setBalance("0.00");
      toast.error(`Failed to fetch your ${tokenType} balance`);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Handle setting max amount
  const handleSetMaxAmount = () => {
    // Haptic feedback for max amount selection
    safeHaptic("medium");
    setAmount(balance);
  };

  // Handle sending tokens using Privy sendTransaction
  const handleSendFunds = async () => {
    if (!account?.address || !user?.wallet) {
      toast.error("No wallet connected");
      return;
    }

    try {
      setIsPending(true);
      setTxError(null);

      // Haptic feedback for critical send action
      safeHaptic("heavy");

      const tokenConfig = TOKENS[selectedToken];

      // Convert amount to wei (both USDC and USDT have 6 decimals)
      const amountInWei = parseUnits(amount, tokenConfig.decimals);

      // Create the transaction data for ERC20 transfer
      const transferData = `0xa9059cbb${recipient
        .slice(2)
        .padStart(64, "0")}${amountInWei.toString(16).padStart(64, "0")}`;

      // Send transaction using Privy's sendTransaction
      const result = await sendTransaction({
        chainId: 534352, // Scroll Mainnet chain ID
        to: tokenConfig.address,
        value: BigInt(0), // No ETH value for token transfers
        gasLimit: BigInt(100000),
        data: transferData as `0x${string}`,
      });

      // Clear any previous error
      setTxError(null);

      // Set transaction hash for success display
      setTxHash(result.hash);

      // Success haptic feedback
      safeHaptic("success");
      toast.success(`Your ${selectedToken} has been sent successfully!`);

      // Reset form
      setAmount("");
      setRecipient("");

      // Refresh local token balance
      fetchTokenBalance();

      // Refresh global balance after confirmed transaction
      if (refreshBalance) {
        refreshBalance();
      }
      if (refreshHoldings) {
        refreshHoldings();
      }
    } catch (error: any) {
      console.error("Send transaction failed:", error);

      // Clear any previous success
      setTxHash(null);

      let errorMessage = "Transaction failed";
      if (error?.message) {
        if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds";
        } else if (error.message.includes("user rejected")) {
          errorMessage = "Transaction cancelled by user";
        } else {
          errorMessage = error.message;
        }
      }

      setTxError(errorMessage);
      safeHaptic("error");
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const currentToken = TOKENS[selectedToken];

  return (
    <>
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
          <Card title={`Send ${selectedToken}`} onClose={onClose}>
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
                    Connect your wallet to send funds
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
                <div className="space-y-4">
                  {/* Token Display with Direct Toggle */}
                  <div
                    className="w-full p-3 mb-4 border rounded-lg border-gray-200 dark:border-white/40 bg-white dark:bg-white/5 cursor-pointer"
                    onClick={() => {
                      mediumHaptic();
                      toggleToken();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 relative">
                          <Image
                            src={currentToken.logoUrl}
                            alt={currentToken.name}
                            width={32}
                            height={32}
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                        <div>
                          <div className="font-medium flex items-center">
                            <span
                              className={`uppercase ${
                                theme === "dark"
                                  ? "text-gray-200"
                                  : "text-gray-800"
                              }`}
                            >
                              {selectedToken}
                            </span>
                            <ChevronDown
                              className={`ml-1 h-4 w-4 ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {isLoadingBalance
                              ? "Loading..."
                              : `${balance} ${currentToken.symbol}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Address */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Send to
                    </label>
                    <input
                      type="text"
                      placeholder="0x... or ENS name"
                      className={`w-full p-3 border ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-black"
                      } rounded-lg`}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label
                        className={`block text-sm font-medium ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Amount
                      </label>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Balance: {balance} {currentToken.symbol}
                        </span>
                        <button
                          className={`text-xs px-2 py-1 rounded ${
                            theme === "dark"
                              ? "bg-gray-700 text-blue-400 hover:bg-gray-600"
                              : "bg-gray-100 text-blue-600 hover:bg-gray-200"
                          }`}
                          onClick={() => {
                            mediumHaptic();
                            handleSetMaxAmount();
                          }}
                          disabled={isPending}
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0"
                        className={`w-full p-3 border ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-black"
                        } rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isPending}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span
                          className={`${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {currentToken.symbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {txError && (
                    <div
                      className={`mt-4 p-3 rounded-lg ${
                        theme === "dark"
                          ? "bg-red-900/30 text-red-200"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <p className="text-sm">
                        <span className="font-bold">Error:</span> {txError}
                      </p>
                    </div>
                  )}

                  {/* Send Button */}
                  <button
                    onClick={() => {
                      heavyHaptic();
                      handleSendFunds();
                    }}
                    disabled={
                      !recipient ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      isLoadingBalance ||
                      isPending
                    }
                    className={`w-full mt-4 bg-[#8266E6] dark:bg-[#3C229C] hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors ${
                      !recipient ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      isLoadingBalance ||
                      isPending
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isPending ? "Sending..." : `Send ${selectedToken}`}
                  </button>

                  {/* Transaction Success */}
                  {txHash && (
                    <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">
                      <p className="text-sm">Transaction sent successfully!</p>
                      <a
                        href={`https://scrollscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-1 block"
                      >
                        <p className="underline">[View on Scroll Explorer]</p>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
