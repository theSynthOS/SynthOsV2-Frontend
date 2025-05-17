"use client"

import { Flame } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState } from "react"
import DepositModal from "./deposit-modal"

export default function TrendingProtocols() {
  const { theme } = useTheme()
  const [selectedPool, setSelectedPool] = useState<any>(null)
  
  const trendingProtocols = [
    { id: "aave", name: "AAVE", apy: 6.13, tvl: "$1.1B", logo: "/aave.png", isUp: true, change: 1.27, riskScore: 2 },
    { id: "fx", name: "FX Protocol", apy: 9.86, tvl: "$463M", logo: "/fx-protocol-logo.png", isUp: true, change: 2.32, riskScore: 3 },
    { id: "quill", name: "Quill Finance", apy: 12.19, tvl: "$262M", logo: "/quill-finance-logo.png", isUp: true, change: 3.15, riskScore: 4 },
    { id: "compound", name: "Compound", apy: 5.45, tvl: "$892M", logo: "/compound.png", isUp: true, change: 0.89, riskScore: 2 },
  ]

  const getRiskLabel = (score: number) => {
    switch(score) {
      case 1: return "Very Low";
      case 2: return "Low";
      case 3: return "Medium";
      case 4: return "High";
      case 5: return "Very High";
      default: return "Unknown";
    }
  }

  const getRiskColor = (score: number) => {
    switch(score) {
      case 1:
      case 2: return "text-green-500";
      case 3: return "text-yellow-500";
      case 4:
      case 5: return "text-red-500";
      default: return "text-gray-500";
    }
  }

  const handleProtocolClick = (protocol: any) => {
    setSelectedPool({
      name: protocol.name,
      apy: protocol.apy,
      risk: getRiskLabel(protocol.riskScore)
    })
  }

  return (
    <>
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <Flame className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Protocol Lists</h2>
        </div>
        <div className="space-y-4">
          {trendingProtocols.map((protocol) => (
            <div 
              key={protocol.id}
              className={`flex flex-col cursor-pointer ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100/50 hover:bg-gray-100'} p-5 rounded-xl transition-colors duration-200 relative h-[20vh]`}
              onClick={() => handleProtocolClick(protocol)}
            >
              <div className={`absolute top-4 right-4 text-lg font-semibold ${getRiskColor(protocol.riskScore)}`}>
                Risk: {protocol.riskScore}
              </div>
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                  <Image src={protocol.logo || "/placeholder.svg"} alt={protocol.name} width={56} height={56} />
                </div>
                <div className="flex-1">
                  <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{protocol.name}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{protocol.tvl} TVL</div>
                </div>
              </div>
              <div className="flex justify-between items-end mt-auto">
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {protocol.apy.toFixed(2)}%
                </div>
                <div className="flex flex-col items-end">
                  <div
                    className={`text-sm ${protocol.isUp ? "text-green-400" : "text-red-400"} flex items-center`}
                  >
                    {protocol.isUp ? "▲" : "▼"}{protocol.change.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DepositModal 
        pool={selectedPool}
        onClose={() => setSelectedPool(null)}
      />
    </>
  )
}
