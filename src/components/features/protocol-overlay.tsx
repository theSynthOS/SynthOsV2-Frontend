"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import ProtocolChart from "@/components/features/protocol-chart"
import { ArrowLeft, Star, Share2, PieChart, Activity, Users, Clock } from "lucide-react"
import Image from "next/image"
import UserPosition from "@/components/features/user-position"
import AvailablePools from "@/components/features/available-pools"
import DepositModal from "@/components/features/deposit-modal"

interface ProtocolOverlayProps {
  protocolId: string
  isOpen: boolean
  onClose: () => void
}

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

export default function ProtocolOverlay({ protocolId, isOpen, onClose }: ProtocolOverlayProps) {
  const { theme } = useTheme()
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
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
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    // Add a small delay to allow the animation to complete
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!isOpen && !isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-50 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Protocol Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md ${theme === 'dark' ? 'bg-[#0f0b22]' : 'bg-white'} shadow-xl transition-transform duration-300 transform z-50 ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-6 pt-6 flex items-center justify-between">
            <button onClick={handleClose} className={`w-8 h-8 flex items-center justify-center ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'}`}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Protocol Details</h1>
            <div className="w-8 h-8"></div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Protocol Info */}
            <div className="px-4 py-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                  <Image src={protocolData.logo || "/placeholder.svg"} alt={protocolData.name} width={32} height={32} />
                </div>
                <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{protocolData.name}</div>
              </div>
              <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{protocolData.currentApy}%</h1>
              <div className="flex items-center mt-2">
                <span className="text-green-400">
                  ▲ {protocolData.change}% ({protocolData.changePercent}%)
                </span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Past day</span>
              </div>
            </div>

            {/* Time Filters */}
            <div className="flex justify-between px-4 py-4">
              <button className="text-green-400 font-medium">LIVE</button>
              <button className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>4H</button>
              <button className="bg-green-400 text-black px-3 py-1 rounded-md">1D</button>
              <button className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>1W</button>
              <button className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>1M</button>
              <button className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>MAX</button>
            </div>

            {/* Chart */}
            <div className="px-4 py-6">
              <ProtocolChart protocolId={protocolId} />
            </div>

            {/* Your Position */}
            <div className={`px-4 py-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <UserPosition protocolName={protocolData.name} positions={userPositions} />
            </div>

            {/* Available Pools/Vaults */}
            <div className={`px-4 py-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <AvailablePools
                pools={protocolData.pools}
                onSelectPool={handleSelectPool}
                selectedPoolId={selectedPool?.id || null}
              />
            </div>

            {/* About */}
            <div className={`px-4 py-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>About</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PieChart className={`w-5 h-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                    <div className={theme === 'dark' ? 'text-white' : 'text-black'}>Market cap</div>
                  </div>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{protocolData.tvl}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className={`w-5 h-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                    <div>
                      <div className={theme === 'dark' ? 'text-white' : 'text-black'}>Volume</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Past 24h</div>
                    </div>
                  </div>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{protocolData.volume}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className={`w-5 h-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                    <div className={theme === 'dark' ? 'text-white' : 'text-black'}>Users</div>
                  </div>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{protocolData.users}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className={`w-5 h-5 mr-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                    <div className={theme === 'dark' ? 'text-white' : 'text-black'}>Created</div>
                  </div>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{protocolData.created}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit Button */}
          <div className={`px-4 py-4 mt-auto border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <button
              className={`w-full py-3 rounded-lg flex items-center justify-center font-semibold ${
                selectedPool 
                  ? "bg-green-400 text-black hover:bg-green-500" 
                  : theme === 'dark' 
                    ? "bg-gray-700 text-gray-400" 
                    : "bg-gray-200 text-gray-600"
              }`}
              disabled={!selectedPool}
              onClick={handleDeposit}
            >
              <span className="mr-2">$</span>
              {selectedPool ? `Deposit into ${selectedPool.name}` : "Select a pool to deposit"}
            </button>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && <DepositModal pool={selectedPool} onClose={() => setShowDepositModal(false)} />}
    </>
  )
} 