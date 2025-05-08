import { Search } from "lucide-react"
import ProtocolSpotlight from "@/components/protocol-spotlight"
import TopYielders from "@/components/top-yielders"
import TrendingProtocols from "@/components/trending-protocols"
import MobileNavigation from "@/components/mobile-navigation"
import PWAInstaller from "@/components/pwa-installer"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0b22] text-white">
      {/* Status Bar - Simplified */}
      <div className="h-6"></div>

      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <span className="text-white">⏱️</span>
        </div>
        <div className="relative flex-1 mx-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-gray-800/50 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none"
          />
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <span className="text-white">⚙️</span>
        </div>
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
        <MobileNavigation />
      </div>
    </div>
  )
}
