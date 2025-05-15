"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";
import ConnectWalletButton from "@/components/CustomConnectWallet";
import { MoveUp, MoveDown, Send } from "lucide-react";
import DepositModal from "@/components/features/wallet-deposit";
import WithdrawModal from "@/components/features/wallet-withdraw";
import SendModal from "@/components/features/wallet-send";
import { useActiveAccount } from "thirdweb/react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export default function HoldingPage() {
  const { address, isAuthenticated, login } = useAuth();
  const account = useActiveAccount();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState<"deposit" | "withdraw" | "send" | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState<string>("/SynthOS-tranparent.png");
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  
  // Set mounted to true on initial load to enable theme rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Debug auth state
  useEffect(() => {
    console.log("Holding page auth state:", { isAuthenticated, address });
    console.log("ThirdWeb account:", account?.address);
  }, [isAuthenticated, address, account]);
  
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
  
  // If ThirdWeb has an account but Auth Context doesn't, update Auth Context
  useEffect(() => {
    // This will keep the auth context in sync with the ThirdWeb account
    if (account?.address && !isAuthenticated) {
      console.log("Syncing ThirdWeb account to Auth Context in holding page:", account.address);
      // You would need the login function from your auth context
      login(account.address);
    }
  }, [account, isAuthenticated]);
  
  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };
  
  // Handle file upload for profile picture
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(null);
  };

  // If theme isn't loaded yet, render nothing to avoid flash
  if (!mounted) return null;

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-[#0f0b22] text-white' : 'bg-white text-black'} p-4`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      {/* Section 1: User Profile */}
      <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-2xl shadow-md p-6 mb-3 mt-14`}>
        <div className="flex flex-col items-center">
          {/* Profile Picture */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-100">
              <Image 
                src={profileImage} 
                alt="Profile" 
                width={96} 
                height={96} 
                className="w-full h-full object-cover"
              />
            </div>
            <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-1.5 cursor-pointer shadow-md">
              <Upload size={14} className="text-white" />
            </label>
            <input 
              id="profile-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleProfileImageChange}
            />
          </div>
          
          {/* Wallet Address */}
          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-3`}>
            {displayAddress ? formatAddress(displayAddress) : "Wallet not connected"}
          </div>
          
          {/* Connect Wallet Button (if not connected) */}
          {!isAuthenticated && (
            <div className="mb-6">
              <ConnectWalletButton />
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between w-full max-w-xs">
            <button 
              onClick={() => setShowModal("deposit")}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center mb-2">
                <MoveDown size={24} className="text-white" />
              </div>
              <span className="text-sm font-medium">Deposit</span>
            </button>
            
            <button 
              onClick={() => setShowModal("withdraw")}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center mb-2">
                <MoveUp size={24} className="text-white" />
              </div>
              <span className="text-sm font-medium">Withdraw</span>
            </button>
            
            <button 
              onClick={() => setShowModal("send")}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center mb-2">
                <Send size={24} className="text-white" />
              </div>
              <span className="text-sm font-medium">Send</span>
            </button>
          </div>
        </div>
      </div>
      </motion.div>
      
      {/* Section 2: Holdings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-2xl shadow-md p-6 `}>
        <h2 className="text-xl font-bold mb-4">Your Holdings</h2>
        
        {balance !== null && balance > 0 ? (
          <div className="space-y-4">
            {/* Example holding */}
            <div className={`flex items-center justify-between p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <span className="text-blue-600">A</span>
                </div>
                <div>
                  <div className="font-medium">Aave</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>APY: 3.2%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${balance.toFixed(2)}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>0.05 ETH</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} mb-3`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>No holdings yet</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Start by depositing assets to earn yields</p>
              <button 
                onClick={() => setShowModal("deposit")}
                className="bg-purple-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-purple-700"
              >
                Deposit Now
              </button>
            </div>
          </div>
        )}
      </div>
      </motion.div>
      
      {/* Modals */}
      {showModal === "deposit" && (
        <DepositModal 
          isOpen={showModal === "deposit"} 
          onClose={closeModal} 
          isAuthenticated={isAuthenticated}
          address={address} 
        />
      )}
      
      {showModal === "withdraw" && (
        <WithdrawModal 
          isOpen={showModal === "withdraw"} 
          onClose={closeModal} 
          isAuthenticated={isAuthenticated}
          address={address}
        />
      )}
     
      
      {showModal === "send" && (
        <SendModal 
          isOpen={showModal === "send"} 
          onClose={closeModal} 
          isAuthenticated={isAuthenticated}
          address={address}
        />
      )}
    </div>
  );
} 