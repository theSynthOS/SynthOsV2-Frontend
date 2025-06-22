import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { client, scrollSepolia } from "@/client";
import { useToast } from "@/hooks/use-toast";
import Card from "@/components/ui/card";
import Image from "next/image";
import { parseUnits } from "viem";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// USDC token details for Scroll Sepolia
const USDC_TOKEN = {
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  address: "0x2c9678042d52b97d27f2bd2947f7111d93f3dd0d", // Scroll Sepolia USDC address
  logoUrl: "/usdc.png",
};

export default function SendModal({ isOpen, onClose }: SendModalProps) {
  const { theme } = useTheme();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const account = useActiveAccount();
  const { toast } = useToast();
  const [balance, setBalance] = useState("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  
  const { mutate: sendTx, isPending } = useSendTransaction();

  // Fetch token balance when account changes
  useEffect(() => {
    if (account?.address) {
      fetchTokenBalance();
    }
  }, [account]);

  // Function to fetch USDC token balance
  const fetchTokenBalance = async () => {
    if (!account?.address) return;
    
    setIsLoadingBalance(true);
    try {
      const response = await fetch(`/api/balance?address=${account.address}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      
      const data = await response.json();
      setBalance(data.usdBalance || "0.00");
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      setBalance("0.00");
      toast({
        variant: "destructive",
        title: "Balance Error",
        description: "Failed to fetch your USDC balance",
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Handle setting max amount
  const handleSetMaxAmount = () => {
    setAmount(balance);
  };

  // Handle sending USDC
  const handleSendFunds = () => {
    // Get USDC contract
    const usdcContract = getContract({
      client,
      chain: scrollSepolia,
      address: USDC_TOKEN.address,
    });

    // Convert amount to wei (USDC has 6 decimals)
    const amountInWei = parseUnits(amount, USDC_TOKEN.decimals);

    // Construct USDC transfer transaction
    const transaction = prepareContractCall({
      contract: usdcContract,
      method: "function transfer(address to, uint256 amount) returns (bool)",
      params: [recipient, amountInWei],
    });
    
    sendTx(transaction, {
      onSuccess: (result) => {
        // Clear any previous error
        setTxError(null);
        
        // Set transaction hash for success display
        setTxHash(result.transactionHash);
        
        toast({
          title: "Transaction Sent",
          description: "Your USDC has been sent successfully!",
        });
        
        // Reset form
        setAmount("");
        setRecipient("");
        
        // Refresh balance
        fetchTokenBalance();
      },
      onError: (error) => {
        console.error("Transaction error:", error);
        
        // Clear any previous success
        setTxHash(null);
        
        let errorMessage = "Transaction failed";
        if (error.message.includes("user rejected transaction")) {
          errorMessage = "You rejected the transaction";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        }
        
        // Set error for display
        setTxError(errorMessage);
        
        toast({
          variant: "destructive",
          title: "Transaction Failed",
          description: errorMessage,
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
      ></div>
      
      {/* Card Content */}
      <div className="relative z-10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card title="Send USDC" onClose={onClose}>
          <div className="max-h-[60vh]">
            {!account ? (
              <div className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} rounded-lg p-4 text-center`}>
                <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} mb-4`}>
                  Connect your wallet to send funds
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Token Display */}
                <div className="w-full flex items-center justify-between p-3 mb-4 border rounded-lg border-gray-200 dark:border-white/40 bg-white dark:bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 relative">
                      <Image 
                        src={USDC_TOKEN.logoUrl}
                        alt={USDC_TOKEN.name}
                        width={32} 
                        height={32}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <div>
                      <div className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>{USDC_TOKEN.name}</div>
                      <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {isLoadingBalance ? "Loading..." : `${balance} ${USDC_TOKEN.symbol}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient Address */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
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
                    <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Amount
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        Balance: {balance} {USDC_TOKEN.symbol}
                      </span>
                      <button 
                        className={`text-xs px-2 py-1 rounded ${theme === "dark" ? "bg-gray-700 text-blue-400 hover:bg-gray-600" : "bg-gray-100 text-blue-600 hover:bg-gray-200"}`}
                        onClick={handleSetMaxAmount}
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
                      } rounded-lg`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isPending}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{USDC_TOKEN.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {txError && (
                  <div className={`mt-4 p-3 rounded-lg ${theme === "dark" ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-800"}`}>
                    <p className="text-sm">
                      <span className="font-bold">Error:</span> {txError}
                    </p>
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSendFunds}
                  disabled={!recipient || !amount || parseFloat(amount) <= 0 || isLoadingBalance || isPending}
                  className={`w-full mt-4 bg-[#8266E6] dark:bg-[#3C229C] hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors ${
                    (!recipient || !amount || parseFloat(amount) <= 0 || isLoadingBalance || isPending) ? 
                      "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isPending ? "Sending..." : "Send USDC"}
                </button>
                
                {/* Transaction Success */}
                {txHash && (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">
                    <p className="text-sm">Transaction sent successfully!</p>
                    <a 
                      href={`https://sepolia.scrollscan.dev/tx/${txHash}`}
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
  );
}