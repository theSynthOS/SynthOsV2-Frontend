"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useConnect, useActiveAccount } from "thirdweb/react";
import { createWallet, inAppWallet, type Wallet } from "thirdweb/wallets";
import { client } from "@/client";
import { scrollSepolia } from "@/client";
import { ChevronRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";


// Utility function to format balance
const formatBalance = (balance: string) => {
  return parseFloat(balance).toFixed(2);
};

// Function to fetch balance
const fetchBalance = async (address: string) => {
  try {
    console.log("Fetching balance for address:", address);
    const response = await fetch(`/api/balance?address=${address}`);
    if (!response.ok) {
      throw new Error("Failed to fetch balance");
    }
    const data = await response.json();
    console.log("Received balance data:", data);
    return data.usdBalance || "0.00";
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0.00";
  }
};

type WalletOption = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

type OAuthProvider = "google" | "apple" | "email" | "x" | "telegram";

type ConnectWalletButtonProps = {
  onConnected?: () => void;
};

export default function ConnectWalletButton({
  onConnected,
}: ConnectWalletButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, address } = useAuth();

  // Open the modal
  const openModal = () => setIsOpen(true);

  // Close the modal
  const closeModal = () => setIsOpen(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Trigger the onConnected callback when authentication status changes to true
  useEffect(() => {
    if (isAuthenticated && address && onConnected) {
      onConnected();
    }
  }, [isAuthenticated, address, onConnected]);

  return (

      <div>
        {/* Connect Wallet Button */}
        <button
          onClick={openModal}
          className="bg-purple-600 hover:bg-purple-400 text-white font-medium py-3 px-5 rounded-lg"
        >
          {isAuthenticated && address
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : "Login"}
        </button>

        {/* Modal Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop - use opacity transition instead of animation */}
            <div
              className="absolute inset-0 bg-black/50 transition-opacity duration-200 ease-in-out"
              onClick={closeModal}
            ></div>

            {/* Modal Content - Optimize animation */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-xl overflow-hidden transition-transform duration-300 ease-out transform translate-y-0"
              style={{ 
                maxHeight: '90vh',
                willChange: 'transform',
                transform: 'translateZ(0)' // Force GPU acceleration 
              }}
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-4"></div>

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Wallet Connection UI */}
              <div
                className="overflow-y-auto"
                style={{ 
                  maxHeight: "calc(90vh - 40px)",
                  transform: 'translateZ(0)', // Force GPU acceleration
                  backfaceVisibility: 'hidden' // Prevent flickering
                }}
              >
                <WalletConnectionUI
                  onClose={closeModal}
                  onConnected={onConnected}
                />
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

// Separate component for the wallet connection UI
function WalletConnectionUI({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected?: () => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"social">(
    "social"
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<string>("");
  const [currentAuth, setCurrentAuth] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");

  const { login, isAuthenticated, address, logout, syncWallet } = useAuth();
  const { connect } = useConnect();
  const activeAccount = useActiveAccount();

  // Monitor active account changes and sync with auth context
  useEffect(() => {
    if (activeAccount?.address && isAuthenticated && address) {
      // If the active account address is different from the auth context address
      if (activeAccount.address !== address) {
        console.log("Account changed in wallet UI:", {
          from: address,
          to: activeAccount.address
        });
        syncWallet(activeAccount.address);
      }
    }
  }, [activeAccount, isAuthenticated, address, syncWallet]);

  // const wallets: WalletOption[] = [
  //   {
  //     id: "io.metamask",
  //     name: "MetaMask",
  //     icon: <span className="text-2xl">🦊</span>,
  //   },
  //   {
  //     id: "com.coinbase.wallet",
  //     name: "Coinbase Wallet",
  //     icon: (
  //       <Image
  //         src="/icons/coinbase.png"
  //         alt="Google"
  //         width={100}
  //         height={100}
  //       />
  //     ),
  //   },
  //   {
  //     id: "me.rainbow",
  //     name: "Rainbow",
  //     icon: <span className="text-2xl">🌈</span>,
  //   },
  //   {
  //     id: "walletconnect",
  //     name: "WalletConnect",
  //     icon: <span className="text-2xl">🔗</span>,
  //   },
  // ];

  const socialOptions: {
    id: OAuthProvider;
    name: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "google",
      name: "Google",
      icon: (
        <Image src="/icons/google.png" alt="Google" width={100} height={1001} />
      ),
    },
    {
      id: "apple",
      name: "Apple",
      icon: (
        <Image src="/icons/apple.png" alt="Apple" width={100} height={100} />
      ),
    },
    {
      id: "x",
      name: "X",
      icon: <Image src="/icons/x.jpg" alt="X" width={100} height={100} />,
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: (
        <Image
          src="/icons/telegram.png"
          alt="Telegram"
          width={100}
          height={100}
        />
      ),
    },
  ];

  // // Connect wallet function
  // const handleConnectWallet = async (walletId: string) => {
  //   try {
  //     setIsConnecting(true);
  //     setCurrentWallet(walletId);
  //     setCurrentAuth("");
  //     setError("");

  //     await connect(async () => {
  //       // Create wallet instance using the correct wallet ID
  //       const wallet = createWallet(walletId as any);

  //       // Connect the wallet
  //       const account = await wallet.connect({
  //         client,
  //       });

  //       // If connection is successful, store in auth context
  //       if (account) {
  //         // Set session in sessionStorage to ensure persistence across refreshes
  //         sessionStorage.setItem("session_active", "true");

  //         // Close modal first
  //         onClose();

  //         // Let the login function in AuthContext handle the redirect
  //         login(account.address, walletId, "wallet", true);

  //         // Call onConnected callback if provided
  //         if (onConnected) {
  //           onConnected();
  //         }
  //       }

  //       // Return the connected wallet
  //       return wallet;
  //     });
  //   } catch (err: any) {
  //     setError(err.message || "Failed to connect wallet");
  //     console.error("Failed to connect wallet:", err);
  //   } finally {
  //     setIsConnecting(false);
  //   }
  // };

  // Connect with social auth (using in-app wallet)
  const handleConnectWithSocial = async (provider: OAuthProvider) => {
    try {
      setIsConnecting(true);
      setCurrentAuth(provider);
      setCurrentWallet("");
      setError("");

      await connect(async () => {
        // Create in-app wallet with the specified auth strategy
        const wallet = inAppWallet({
          auth: {
            options: [provider],
            mode: "popup",
            redirectUrl: window.location.href,
          },
          smartAccount: {
            chain: scrollSepolia,
            sponsorGas: true,
          },
        });

        // Connect the wallet to the client with the specific strategy
        // Each strategy requires different connection options
        if (provider === "google" || provider === "apple" || provider === "x") {
          const account = await wallet.connect({
            client,
            strategy: provider,
          });

          // If connection is successful, store in auth context
          if (account) {
            // Set session in sessionStorage to ensure persistence across refreshes
            sessionStorage.setItem("session_active", "true");
            onClose();
            login(account.address, undefined, provider, true);

            // Call onConnected callback if provided
            if (onConnected) {
              onConnected();
            }
          }
        } else if (provider === "email") {
          setError(
            "Email authentication requires verification code. Not implemented in this demo."
          );
          throw new Error("Email authentication not implemented");
        }

        return wallet;
      });
    } catch (err: any) {
      setError(err.message || `Failed to connect with ${provider}`);
      console.error(`Failed to connect with ${provider}:`, err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const handleDisconnect = () => {
    console.log("Disconnecting wallet...");
    sessionStorage.removeItem("session_active");
    onClose();
    window.location.href = "/";
    logout();
  };

  // Add useEffect to fetch balance when address changes
  useEffect(() => {
    if (address) {
      console.log("Address changed, fetching balance for:", address);
      const updateBalance = async () => {
        const newBalance = await fetchBalance(address);
        console.log("Setting new balance:", newBalance);
        setBalance(newBalance);
      };

      updateBalance();
      // Update balance every 30 seconds
      const interval = setInterval(updateBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [address]);

  return (
    <div className="p-6 w-full max-w-md mx-auto text-black pb-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Connect to Continue</h2>
      </div>

      {/* Tabs */}
      {/* <div className="flex mb-6"> */}
        {/* <button
          className={`flex-1 py-3 px-4 text-lg font-medium ${
            activeTab === "social"
              ? "text-purple-500 border-b-2 border-purple-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("social")}
        >
          Social
        </button> */}

        {/* <button
          className={`flex-1 py-3 px-4 text-lg font-medium ${
            activeTab === "wallets"
              ? "text-purple-500 border-b-2 border-purple-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("wallets")}
        >
          Wallets
        </button> */}
        {/* <button
          className={`flex-1 py-3 px-4 text-lg font-medium ${
            activeTab === "passkey" 
              ? "text-green-500 border-b-2 border-green-500" 
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("passkey")}
        >
          Passkey
        </button> */}
      {/* </div> */}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Connected Account Info */}
      {isAuthenticated && address && (
        <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">Connected with:</p>
          <p className="font-mono text-sm truncate">{address}</p>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Balance:</p>
            <div className="flex items-center">
              <p className="font-mono text-2xl font-bold">
                ${formatBalance(balance)}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Wallet Options */}
      {/* {activeTab === "wallets" && (
        <div className="space-y-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnectWallet(wallet.id)}
              disabled={isConnecting && currentWallet === wallet.id}
              className={`flex items-center justify-between w-full p-4 shadow-md shadow-purple-900/50 rounded-xl hover:bg-gray-50 ${
                isConnecting && currentWallet !== wallet.id ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center mr-3">
                  {wallet.icon}
                </div>
                <span className="text-lg font-medium">{wallet.name}</span>
              </div>

              {isConnecting && currentWallet === wallet.id ? (
                <div className="animate-spin h-5 w-5 border-2 border-purple-600  border-t-transparent rounded-full"></div>
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-400" />
              )}
            </button>
          ))}
        </div>
      )} */}

      {/* Social Login Options */}
      {activeTab === "social" && (
        <div className="space-y-4">
          {socialOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleConnectWithSocial(option.id)}
              disabled={isConnecting && currentAuth === option.id}
              className={`flex items-center justify-between w-full p-4 shadow-md shadow-purple-900/50  rounded-xl hover:bg-gray-50 ${
                isConnecting && currentAuth !== option.id ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center mr-3">
                  {option.icon}
                </div>
                <span className="text-lg font-medium">{option.name}</span>
              </div>

              {isConnecting && currentAuth === option.id ? (
                <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Passkey Options */}
      {/* {activeTab === "passkey" && (
        <div className="text-center p-4">
          <div className="h-16 w-16 mx-auto mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            Connect securely using a passkey - a more secure alternative to
            passwords that lets you sign in using your device's authentication
            methods like fingerprint, face recognition, or screen lock.
          </p>
          <button
            onClick={handleConnectWithPasskey}
            disabled={isConnecting && currentAuth === "passkey"}
            className={`w-full flex items-center justify-center p-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium ${
              isConnecting && currentAuth === "passkey" ? "opacity-70" : ""
            }`}
          >
            {isConnecting && currentAuth === "passkey" && (
              <span className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
            )}
            <span>
              {isConnecting && currentAuth === "passkey" ? "Connecting..." : "Continue with Passkey"}
            </span>
          </button>
        </div>
      )} */}

      <div className="mt-8 text-center text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}
