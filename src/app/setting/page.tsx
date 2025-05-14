"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, User, Settings, LogOut, CreditCard, Bell, Shield, Info, MessageCircle, LogIn, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

export default function SettingPage() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Update display address whenever account or auth address changes
  useEffect(() => {
    // First priority: use account from thirdweb if available
    if (account && account.address) {
      console.log("Setting page: Using account address from thirdweb:", account.address);
      setDisplayAddress(account.address);
    } 
    // Second priority: use address from auth context
    else if (address) {
      console.log("Setting page: Using address from auth context:", address);
      setDisplayAddress(address);
    } 
    // If neither is available, clear the display address
    else {
      console.log("Setting page: No address available");
      setDisplayAddress(null);
    }
  }, [account, address]);

  const handleAuth = () => {
    if (isAuthenticated) {
      // Use the logout function from AuthContext
      logout();
    } else {
      // Redirect to root page for login
      router.push("/");
    }
  };

  const handleGoBack = () => {
    if (displayAddress) {
      router.push("/home");
    } else {
      router.push("/");
    }
  };

  // Protection in case user directly navigates to this page
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#0f0b22] flex items-center justify-center">
        <div className="text-white">Checking authentication...</div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-[#0f0b22] text-white' : 'bg-white text-black'} pt-[80px]`}>
      {/* Header */}
      <div className="px-4 pb-6 flex items-center justify-between">
        <button onClick={handleGoBack} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">Profile</h1>
        <div className="w-8 h-8"></div>
      </div>

      {/* User Info */}
      <div className={`px-4 pb-6 flex items-center border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mr-4`}>
          <User className={`h-8 w-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Wallet User - gmail</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
            {account && account.address ? formatAddress(account.address) : "Not connected"}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-4">
        <div className={`flex items-center justify-between p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}>
          <div className="flex items-center">
            {mounted && theme === "dark" ? (
              <Moon className={`h-5 w-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            ) : (
              <Sun className={`h-5 w-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              theme === "dark" ? "bg-green-400" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                theme === "dark" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className={`flex items-center p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}>
          <Settings className={`h-5 w-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span>Settings</span>
        </div>
        
        <div className={`flex items-center p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}>
          <CreditCard className={`h-5 w-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span>Payment Methods</span>
        </div>
        
        <div className={`flex items-center p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}>
          <Bell className={`h-5 w-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span>Notifications</span>
        </div>
        
        <div className={`flex items-center p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}>
          <Shield className={`h-5 w-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span>Security</span>
        </div>
        
        <div className={`flex items-center p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}>
          <Info className={`h-5 w-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span>About</span>
        </div>
        
        <div className={`flex items-center p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}>
          <MessageCircle className={`h-5 w-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span>Support</span>
        </div>
        
        <button 
          onClick={handleAuth}
          className={`w-full flex items-center p-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg text-red-400`}
        >
          {isAuthenticated ? (
            <>
              <LogOut className="h-5 w-5 mr-3" />
              <span>Log Out</span>
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5 mr-3" />
              <span>Log In</span>
            </>
          )}
        </button>
      </div>
      
      <div className={`mt-auto p-4 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>SynthOS</p>
        <p>© 2025 SynthOS. All rights reserved.</p>
      </div>
    </div>
  );
} 