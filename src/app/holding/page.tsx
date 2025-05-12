"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, User, Settings, LogOut, CreditCard, Bell, Shield, Info, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  




  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0b22] text-white">
      {/* Header */}
      <div className="px-4 pb-6 pt-2 flex items-center justify-between">
        <Link href="/" className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold">Profile</h1>
        <div className="w-8 h-8"></div>
      </div>

      {/* User Info */}
      <div className="px-4 py-6 flex items-center border-b border-gray-800">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mr-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Wallet User</h2>
          <p className="text-sm text-gray-400 truncate">
            {formatAddress(userAddress)}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
          <Settings className="h-5 w-5 mr-3 text-gray-400" />
          <span>Settings</span>
        </div>
        
        <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
          <CreditCard className="h-5 w-5 mr-3 text-gray-400" />
          <span>Payment Methods</span>
        </div>
        
        <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
          <Bell className="h-5 w-5 mr-3 text-gray-400" />
          <span>Notifications</span>
        </div>
        
        <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
          <Shield className="h-5 w-5 mr-3 text-gray-400" />
          <span>Security</span>
        </div>
        
        <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
          <Info className="h-5 w-5 mr-3 text-gray-400" />
          <span>About</span>
        </div>
        
        <div className="flex items-center p-3 bg-gray-800/50 rounded-lg">
          <MessageCircle className="h-5 w-5 mr-3 text-gray-400" />
          <span>Support</span>
        </div>
        
        <button 
          //onClick={handleLogout}
          className="w-full flex items-center p-3 bg-gray-800/50 rounded-lg text-red-400"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Log Out</span>
        </button>
      </div>
      
      <div className="mt-auto p-4 text-center text-sm text-gray-400">
        <p>SynthOS</p>
        <p>© 2025 SynthOS. All rights reserved.</p>
      </div>
    </div>
  );
} 