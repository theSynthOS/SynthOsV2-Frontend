"use client"

import { useState } from "react"
import { ArrowLeft, Star, Share2, PieChart, Activity, Users, Clock } from "lucide-react"
import Image from "next/image"
import ProtocolChart from "@/components/features/protocol-chart"
import Navbar from "@/components/features/navigation"
import UserPosition from "@/components/features/user-position"
import AvailablePools from "@/components/features/available-pools"
import DepositModal from "@/components/features/deposit-modal"
import { useRouter } from "next/navigation"

interface ProtocolPageProps {
  params: {
    id: string
  }
}

// Protocol data mapping
const protocolsData = {
  aave: {
    name: "AAVE",
    logo: "/aave-logo.png",
    currentApy: 6.13,
    change: 0.0619,
    changePercent: 6.05,
    tvl: "$1.1B",
    volume: "$246M",
    users: "155K",
    totalSupply: "999M",
    created: "6mo ago",
    pools: [
      { id: 1, name: "ETH Lending", apy: 5.2, tvl: "$320M", risk: "Low" },
      { id: 2, name: "USDC Lending", apy: 6.8, tvl: "$450M", risk: "Low" },
      { id: 3, name: "BTC Lending", apy: 4.5, tvl: "$180M", risk: "Low" },
      { id: 4, name: "DAI Lending", apy: 7.1, tvl: "$150M", risk: "Low" },
    ],
  },
  fx: {
    name: "FX Protocol",
    logo: "/fx-protocol-logo.png",
    currentApy: 9.86,
    change: 0.0786,
    changePercent: 8.65,
    tvl: "$463M",
    volume: "$98M",
    users: "42K",
    totalSupply: "500M",
    created: "1yr ago",
    pools: [
      { id: 1, name: "ETH/USDC LP", apy: 8.9, tvl: "$120M", risk: "Medium" },
      { id: 2, name: "BTC/USDC LP", apy: 9.2, tvl: "$95M", risk: "Medium" },
      { id: 3, name: "FX Staking", apy: 12.5, tvl: "$85M", risk: "Medium" },
      { id: 4, name: "Stability Pool", apy: 7.8, tvl: "$163M", risk: "Low" },
    ],
  },
  quill: {
    name: "Quill Finance",
    logo: "/quill-finance-logo.png",
    currentApy: 12.19,
    change: 0.1219,
    changePercent: 11.12,
    tvl: "$262M",
    volume: "$75M",
    users: "28K",
    totalSupply: "250M",
    created: "3mo ago",
    pools: [
      { id: 1, name: "Quill Vault V1", apy: 11.5, tvl: "$75M", risk: "Medium" },
      { id: 2, name: "ETH Yield Vault", apy: 14.2, tvl: "$62M", risk: "High" },
      { id: 3, name: "Stablecoin Vault", apy: 9.8, tvl: "$105M", risk: "Low" },
      { id: 4, name: "BTC Yield Vault", apy: 13.3, tvl: "$20M", risk: "High" },
    ],
  },
};

export default function ProtocolPage({ params }: ProtocolPageProps) {
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const protocolId = params.id as string;
  const router = useRouter()

  // Get protocol data or default to aave
  const protocolData = protocolsData[protocolId as keyof typeof protocolsData] || protocolsData.aave;

  // Example user positions - empty for now
  const userPositions: any[] = [];

  const handleSelectPool = (pool: any) => {
    setSelectedPool(pool?.id === selectedPool?.id ? null : pool)
  }

  const handleDeposit = () => {
    if (selectedPool) {
      setShowDepositModal(true)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0b22] text-white">
      {/* Status Bar - Simplified */}
      <div className="flex justify-between">
        {/* history */}
        <div>
          
        </div>
        {/* Search */}
        <div>
          
        </div>
        {/* setting */}
        <div>
          
        </div>
      </div>
      
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="w-8 h-8 flex items-center justify-center"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
            <Image src={protocolData.logo || "/placeholder.svg"} alt={protocolData.name} width={32} height={32} />
          </div>
          <div className="font-semibold">{protocolData.name}</div>
        </div>
        <div className="flex gap-4">
          <button className="w-8 h-8 flex items-center justify-center">
            <Star className="h-5 w-5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Protocol Info */}
      <div className="px-4 py-6">
        <h1 className="text-4xl font-bold">{protocolData.currentApy}%</h1>
        <div className="flex items-center mt-2">
          <span className="text-green-400">
            ▲ {protocolData.change}% ({protocolData.changePercent}%)
          </span>
          <span className="text-gray-400 ml-2">Past day</span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 py-6">
        <ProtocolChart protocolId={protocolId} />
      </div>

      {/* Time Filters */}
      <div className="flex justify-between px-4 py-4">
        <button className="text-green-400 font-medium">LIVE</button>
        <button className="text-gray-400">4H</button>
        <button className="bg-green-400 text-black px-3 py-1 rounded-md">1D</button>
        <button className="text-gray-400">1W</button>
        <button className="text-gray-400">1M</button>
        <button className="text-gray-400">MAX</button>
      </div>

      {/* Your Position */}
      <div className="px-4 py-4 border-t border-gray-800">
        <UserPosition protocolName={protocolData.name} positions={userPositions} />
      </div>

      {/* Available Pools/Vaults */}
      <div className="px-4 py-4 border-t border-gray-800">
        <AvailablePools
          pools={protocolData.pools}
          onSelectPool={handleSelectPool}
          selectedPoolId={selectedPool?.id || null}
        />
      </div>

      {/* About */}
      <div className="px-4 py-4 border-t border-gray-800">
        <h2 className="text-xl font-bold mb-4">About</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PieChart className="w-5 h-5 mr-3 text-gray-400" />
              <div>Market cap</div>
            </div>
            <div className="font-semibold">{protocolData.tvl}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-3 text-gray-400" />
              <div>
                <div>Volume</div>
                <div className="text-sm text-gray-400">Past 24h</div>
              </div>
            </div>
            <div className="font-semibold">{protocolData.volume}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-gray-400" />
              <div>Users</div>
            </div>
            <div className="font-semibold">{protocolData.users}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-3 text-gray-400" />
              <div>Created</div>
            </div>
            <div className="font-semibold">{protocolData.created}</div>
          </div>
        </div>
      </div>

      {/* Deposit Button */}
      <div className="px-4 py-4 mt-auto">
        <button
          className={`w-full py-3 rounded-lg flex items-center justify-center font-semibold ${
            selectedPool ? "bg-green-400 text-black" : "bg-gray-700 text-gray-400"
          }`}
          disabled={!selectedPool}
          onClick={handleDeposit}
        >
          <span className="mr-2">$</span>
          {selectedPool ? `Deposit into ${selectedPool.name}` : "Select a pool to deposit"}
        </button>
      </div>
      {/* Deposit Modal */}
      {showDepositModal && <DepositModal pool={selectedPool} onClose={() => setShowDepositModal(false)} />}
    </div>
  )
}
