"use client"

import { Search, Settings, History } from "lucide-react"
import { useRouter } from "next/navigation"
import ProtocolSpotlight from "@/components/features/protocol-spotlight"
import TopYielders from "@/components/features/top-yielders"
import TrendingProtocols from "@/components/features/trending-protocols"
import Navbar from "@/components/features/navigation"
import PWAInstaller from "@/components/features/pwa-installer"
import { wallets } from "../WalletProvider"
import { client, scrollSepolia } from "@/client"
import { ConnectButton } from "thirdweb/react"

export default function Home() {
  const router = useRouter()
  
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0b22] text-white">
      {/* Status Bar with history, search, settings */}
      <div className="flex justify-between items-center p-4">
        <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          <History className="h-4 w-4 text-gray-400" />
        </button>
        <div className="relative flex-1 mx-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search protocols"
            className="w-full bg-gray-800/50 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none"
          />
        </div>
        
        <button 
          className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
          onClick={() => router.push("/setting")}
        >
          <Settings className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Balance */}
      <div className="px-4 py-6">
        <div className="text-gray-400 text-sm">Total balance</div>
        <div className="flex items-center">
          <div className="text-4xl font-bold">$0.00</div>
          <div className="ml-2 text-gray-400">▶</div>
        </div>
      </div>

      {/* Spotlight */}
      <ProtocolSpotlight />

      {/* Top Yielders */}
      <TopYielders />

      {/* Trending */}
      <TrendingProtocols />

      {/* PWA Installer */}
      <PWAInstaller />

      
      {/* Navigation */}
      <div className="mt-auto">
        <Navbar />
      </div>
    </div>
  )
}
