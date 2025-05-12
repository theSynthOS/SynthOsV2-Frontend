"use client"

import { Search, Settings, History } from "lucide-react"
import { useRouter } from "next/navigation"
import ProtocolSpotlight from "@/components/features/protocol-spotlight"
import TopYielders from "@/components/features/top-yielders"
import TrendingProtocols from "@/components/features/trending-protocols"
import PWAInstaller from "@/components/features/pwa-installer"
import { wallets } from "../WalletProvider"
import { client, scrollSepolia } from "@/client"
import { ConnectButton, useActiveAccount } from "thirdweb/react"
import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  // Redirect to root if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0b22] text-white">
      {/* Balance */}
      <div className="px-4 py-6 pt-[68px]">
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
    </div>
  )
}
