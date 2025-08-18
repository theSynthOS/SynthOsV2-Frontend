import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { usePrivy, useSendTransaction } from "@privy-io/react-auth";
import Card from "@/components/ui/card";
import Image from "next/image";
import { parseUnits, formatUnits, isAddress } from "viem";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { safeHaptic, mediumHaptic, heavyHaptic } from "@/lib/haptic-utils";
import { useBalance } from "@/contexts/BalanceContext";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { sendTokenTransaction, getWalletId } from "@/lib/smart-wallet-utils";

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
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const { user, authenticated, login } = usePrivy();
  const [balance, setBalance] = useState("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenType>("USDC");
  const [lastBalanceData, setLastBalanceData] = useState<{
    usdc: string;
    usdt: string;
  } | null>(null);
  const { refreshBalance, refreshHoldings } = useBalance();

  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  
  // Add a reference to track if modal is closed during processing
  const modalClosedDuringProcessingRef = useRef(false);

  const { sendTransaction } = useSendTransaction();
  const { displayAddress, smartWalletClient, isSmartWalletActive } =
    useSmartWallet();

  // Use display address from context
  const account =
    authenticated && displayAddress ? { address: displayAddress } : null;

  // Handle modal close
  const handleClose = () => {
    // Only show "in progress" toast if transaction is still processing
    if (isPending && !txHash && !txError) {
      // Mark that the modal was closed during processing
      modalClosedDuringProcessingRef.current = true;

      // Show a toast notification that transaction is still processing
      toast.info("Transaction in Progress", {
        description: "Your transfer is still processing in the background",
      });
    }
    
    // Call the original onClose function
    onClose();
  };

  // Toggle between USDC and USDT
  const toggleToken = () => {
    const newToken = selectedToken === "USDC" ? "USDT" : "USDC";
    setSelectedToken(newToken);
    setAmount("");
    setAmountError(null);
    // The useEffect will automatically update the balance for the new token
  };

  // Validate recipient address when it changes
  useEffect(() => {
    if (recipient) {
      if (!recipient.startsWith("0x")) {
        setRecipientError("Address must start with 0x");
      } else if (!isAddress(recipient)) {
        setRecipientError("Invalid Ethereum address format");
      } else {
        setRecipientError(null);
      }
    } else {
      setRecipientError(null);
    }
  }, [recipient]);

  // Validate amount when it changes
  useEffect(() => {
    if (amount) {
      const amountNum = parseFloat(amount);
      const balanceNum = parseFloat(balance);
      
      if (amountNum <= 0) {
        setAmountError("Amount must be greater than 0");
      } else if (amountNum > balanceNum) {
        setAmountError(`Insufficient balance. Maximum: ${parseFloat(balance).toFixed(3)}`);
      } else {
        setAmountError(null);
      }
    } else {
      setAmountError(null);
    }
  }, [amount, balance]);

  // Fetch token balance when account changes (like settings panel)
  useEffect(() => {
    if (account?.address) {
      // Clear cached data for new account
      setLastBalanceData(null);
      fetchTokenBalance();
    }
  }, [account?.address]); // Only depend on address, not selectedToken

  // Update balance display when selectedToken changes
  useEffect(() => {
    if (account?.address) {
      // If we have cached data, use it immediately for instant switching
      if (lastBalanceData) {
        const cachedBalance =
          selectedToken === "USDC"
            ? lastBalanceData.usdc
            : lastBalanceData.usdt;
        setBalance(cachedBalance || "0.00");
      } else {
        // Otherwise fetch the data
        fetchTokenBalanceForToken(selectedToken);
      }
    }
  }, [selectedToken, account?.address, lastBalanceData]);

  // Function to fetch token balance for a specific token
  const fetchTokenBalanceForToken = async (tokenType: TokenType) => {
    if (!account?.address) return;

    // If we have cached data, use it immediately
    if (lastBalanceData) {
      const cachedBalance =
        tokenType === "USDC" ? lastBalanceData.usdc : lastBalanceData.usdt;
      setBalance(cachedBalance || "0.00");
      return;
    }

    setIsLoadingBalance(true);
    try {
      // Use wallet ID from utility function
      const walletId = getWalletId(user);
      if (!walletId) {
        console.warn("No wallet ID available");
        setBalance("0.00");
        return;
      }

      // Fetch balance from the same API endpoint used by the settings panel
      const response = await fetch(`/api/balance?address=${account.address}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Failed to fetch balance, using fallback value");
        setBalance("0.00");
        return;
      }

      const data = await response.json();
      console.log("Balance response:", data);

      // Cache the balance data
      setLastBalanceData({
        usdc: data.usdcBalance || "0.00",
        usdt: data.usdtBalance || "0.00",
      });

      // Extract the specific token balance based on the provided tokenType
      const tokenBalance =
        tokenType === "USDC" ? data.usdcBalance : data.usdtBalance;
      setBalance(tokenBalance || "0.00");
    } catch (error) {
      console.error(`Failed to fetch ${tokenType} balance:`, error);
      setBalance("0.00");
      toast.error(`Failed to fetch your ${tokenType} balance`, {
        description: "Please try again or check your network connection",
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Function to fetch token balance using the same API as settings panel
  const fetchTokenBalance = async () => {
    if (!account?.address) return;

    setIsLoadingBalance(true);
    try {
      // Use wallet ID from utility function
      const walletId = getWalletId(user);
      if (!walletId) {
        console.warn("No wallet ID available");
        setBalance("0.00");
        return;
      }

      // Fetch balance from the same API endpoint used by the settings panel
      const response = await fetch(`/api/balance?address=${account.address}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Failed to fetch balance, using fallback value");
        setBalance("0.00");
        return;
      }

      const data = await response.json();
      console.log("Balance response:", data);

      // Cache the balance data
      setLastBalanceData({
        usdc: data.usdcBalance || "0.00",
        usdt: data.usdtBalance || "0.00",
      });

      // Extract the specific token balance based on current selectedToken
      const tokenBalance =
        selectedToken === "USDC" ? data.usdcBalance : data.usdtBalance;
      setBalance(tokenBalance || "0.00");
    } catch (error) {
      console.error(`Failed to fetch ${selectedToken} balance:`, error);
      setBalance("0.00");
      toast.error(`Failed to fetch your ${selectedToken} balance`, {
        description: "Please try again or check your network connection",
      });
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
      toast.error("No wallet connected", {
        description: "Please connect your wallet to send funds",
      });
      return;
    }

    // Reset the modalClosedDuringProcessingRef flag when starting a new transaction
    modalClosedDuringProcessingRef.current = false;

    // Validate recipient address before proceeding
    if (!recipient.startsWith("0x") || !isAddress(recipient)) {
      setTxError("Invalid recipient address");
      safeHaptic("error");
      toast.error("Invalid recipient address", {
        description: "Please enter a valid Ethereum address starting with 0x",
      });
      return;
    }

    // Validate amount before proceeding
    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(balance);
    if (amountNum <= 0) {
      setTxError("Invalid amount");
      safeHaptic("error");
      toast.error("Invalid amount", {
        description: "Amount must be greater than 0",
      });
      return;
    }
    
    if (amountNum > balanceNum) {
      setTxError("Insufficient balance");
      safeHaptic("error");
      const formattedBalance = parseFloat(balance).toFixed(3);
      toast.error("Insufficient balance", {
        description: `You only have ${formattedBalance} ${selectedToken} available`,
      });
      return;
    }

    try {
      setIsPending(true);
      setTxError(null);

      // Haptic feedback for critical send action
      safeHaptic("heavy");

      // Use smart wallet client for transaction if available, otherwise use regular sendTransaction
      console.log("Using smart wallet for transaction");

      let result;
      if (smartWalletClient && isSmartWalletActive) {
        // Use smart wallet client
        result = await sendTokenTransaction(
          smartWalletClient,
          selectedToken,
          recipient,
          amount
        );
      } else {
        // Fallback to regular sendTransaction
        const tokenConfig = TOKENS[selectedToken];
        const amountInWei = parseUnits(amount, tokenConfig.decimals);
        const transferData = `0xa9059cbb${recipient
          .slice(2)
          .padStart(64, "0")}${amountInWei.toString(16).padStart(64, "0")}`;

        result = await sendTransaction({
          chainId: 534352, // Scroll Mainnet chain ID
          to: tokenConfig.address,
          value: BigInt(0), // No ETH value for token transfers
          gasLimit: BigInt(100000),
          data: transferData as `0x${string}`,
        });
      }

      // Clear any previous error
      setTxError(null);

      // Extract and normalize the transaction hash from the result
      let transactionHash = '';
      
      // Handle different result formats
      if (result) {
        if (typeof result === 'string') {
          // If result is directly the hash string
          transactionHash = result;
        } else if (result.hash) {
          // If result has a hash property
          transactionHash = result.hash;
        } else if (result.transactionHash) {
          // Some wallets return transactionHash instead of hash
          transactionHash = result.transactionHash;
        }
      }
      
      // Set transaction hash for success display if we have one
      if (transactionHash) {
        setTxHash(transactionHash);
      }

      // Success haptic feedback
      safeHaptic("success");
      
      // Ensure the transaction hash is properly formatted (remove any leading/trailing whitespace)
      // and handle the case where it might be undefined
      const formattedHash = transactionHash ? transactionHash.trim() : '';
      
      // Format amount to 3 decimal places for toast messages
      const formattedAmount = parseFloat(amount).toFixed(3);
      
      // Show success toast only if the modal wasn't closed during processing
      if (!modalClosedDuringProcessingRef.current) {
        toast.success(`Your ${selectedToken} has been sent successfully!`, {
          description: "Transaction has been submitted to the network",
          action: transactionHash ? {
            label: "View Transaction",
            onClick: () => window.open(`https://scrollscan.com/tx/${formattedHash}`, "_blank"),
          } : undefined,
        });
      } else {
        // If modal was closed during processing, show a different toast with transaction link
        toast.success(`${selectedToken} Transfer Complete`, {
          description: `Your transfer of ${formattedAmount} ${selectedToken} was successful`,
          action: transactionHash ? {
            label: "View Transaction",
            onClick: () => window.open(`https://scrollscan.com/tx/${formattedHash}`, "_blank"),
          } : undefined,
        });
      }

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
      let errorDescription = "Please try again or contact support";

      if (error?.message) {
        if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds";
          errorDescription = "Please check your balance and try again";
        } else if (error.message.includes("user rejected")) {
          errorMessage = "Transaction cancelled by user";
          errorDescription = "You cancelled the transaction";
        } else if (error.message.includes("invalid address")) {
          errorMessage = "Invalid recipient address";
          errorDescription = "Please enter a valid Ethereum address";
        } else if (error.message.includes("execution reverted")) {
          errorMessage = "Transaction rejected by network";
          errorDescription = "The network rejected this transaction";
        } else {
          // Make technical error messages more user-friendly
          errorMessage = "Transaction failed";
          errorDescription = "An error occurred while processing your transaction";
          console.error("Original error:", error.message);
        }
      }

      setTxError(errorMessage);
      safeHaptic("error");
      
      // Show error toast, considering if the modal was closed
      if (!modalClosedDuringProcessingRef.current) {
        toast.error(errorMessage, {
          description: errorDescription,
        });
      } else {
        // If modal was closed, show a more detailed error toast
        toast.error("Transfer Failed", {
          description: errorDescription || "Your transaction could not be completed",
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  const currentToken = TOKENS[selectedToken];

  return (
    <>
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        onClick={handleClose}
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
          <Card title={`Send ${selectedToken}`} onClose={handleClose}>
            <div className="max-h-[60vh]">
              {!account ? (
                <div
                  className={`${"bg-transparent"} rounded-lg p-4 text-center`}
                >
                  <p
                    className={`${
                      theme === "dark" ? "text-gray-400" : "text-gray-800"
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
                              : `${parseFloat(balance).toFixed(3)} ${currentToken.symbol}`}
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
                      } ${recipientError ? "border-red-500" : ""} rounded-lg`}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      disabled={isPending}
                    />
                    {recipientError && (
                      <p className="mt-1 text-sm text-red-500">{recipientError}</p>
                    )}
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
                          Balance: {parseFloat(balance).toFixed(3)} {currentToken.symbol}
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
                        } ${amountError ? "border-red-500" : ""} rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
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
                    {amountError && (
                      <p className="mt-1 text-sm text-red-500">{amountError}</p>
                    )}
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
                      isPending ||
                      !!recipientError ||
                      !!amountError
                    }
                    className={`w-full mt-4 bg-[#8266E6] dark:bg-[#3C229C] hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors ${
                      !recipient ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      isLoadingBalance ||
                      isPending ||
                      !!recipientError ||
                      !!amountError
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isPending ? "Sending..." : `Send ${selectedToken}`}
                  </button>

                  {/* Transaction Success */}
                  {txHash && (
                    <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 text-black-800 dark:text-white rounded-lg">
                      <p className="text-sm">Transaction sent successfully!</p>
                      <a
                        href={`https://scrollscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-1 block"
                      >
                        <p className="underline">[View transaction]</p>
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
