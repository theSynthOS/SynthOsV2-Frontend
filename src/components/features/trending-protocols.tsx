"use client"

import { Flame, Filter, ArrowUpDown, Check, X } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import DepositModal from "./deposit-modal"

export default function TrendingProtocols() {
  const { theme } = useTheme()
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [riskFilters, setRiskFilters] = useState({
    all: true,
    low: false,
    medium: false,
    high: false
  })
  const [showFilter, setShowFilter] = useState(false)
  
  const trendingProtocols = [
    { id: "fx", name: "FX", pair: 'USDT', type: 'supply', apy: 9.86, tvl: "$463M", logo: "/fx-protocol-logo.png",  riskScore: 3 },
    { id: "quill", name: "Quill Finance", pair: 'ETH', type: 'earn', apy: 12.19, tvl: "$262M", logo: "/quill-finance-logo.png",  riskScore: 4 },
    { id: "fx", name: "FX ", pair: 'FXS', type: 'supply', apy: 5.45, tvl: "$892M", logo: "/compound.png", riskScore: 2 },
    { id: "quill", name: "Quill Finance", pair: 'wstETH', type: 'earn', apy: 33.19, tvl: "$262M", logo: "/quill-finance-logo.png",  riskScore: 9 },
    { id: "aave", name: "AAVE", pair: 'GHO/USDT', type: 'supply', apy: 1.13, tvl: "$1.1B", logo: "/aave.png",  riskScore: 1 },
    { id: "ambient", name: "Ambient", pair: 'USDC/USDT', type: 'vault', apy: 2.19, tvl: "$487k", logo: "/ambient.png", riskScore: 2 },
    { id: "ambient", name: "Ambient", pair: 'SCR/ETH', type: 'vault', apy: 27.98, tvl: "$15.06k", logo: "/ambient.png", riskScore: 10 },
    { id: "ambient", name: "Ambient", pair: 'wstETH/wrsWTH', type: 'vault', apy: 3.45, tvl: "$15.92k", logo: "/ambient.png", riskScore: 5 },
    { id: "aave", name: "AAVE", pair: 'GHO', type: 'supply', apy: 6.13, tvl: "$1.1B", logo: "/aave.png", riskScore: 2 },
  ]

  const getRiskCategory = (score: number) => {
    if (score >= 1 && score <= 3) return "low";
    if (score >= 4 && score <= 7) return "medium";
    if (score >= 8 && score <= 10) return "high";
    return "unknown";
  }

  const getRiskLabel = (score: number) => {
    const category = getRiskCategory(score);
    switch(category) {
      case "low": return "Low";
      case "medium": return "Medium";
      case "high": return "High";
      default: return "Unknown";
    }
  }

  const getRiskColor = (score: number) => {
    const category = getRiskCategory(score);
    switch(category) {
      case "low": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "high": return "text-red-500";
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

  const toggleRiskFilter = (category: 'all' | 'low' | 'medium' | 'high') => {
    // Set only the selected filter to true, all others to false
    setRiskFilters({
      all: category === 'all',
      low: category === 'low',
      medium: category === 'medium',
      high: category === 'high'
    });
    
    // Close the filter menu after selection
    setShowFilter(false);
  }

  // Debug version of the filtering function to track what's happening
  const filteredProtocols = trendingProtocols
    .filter(protocol => {
      // If showing all, return all protocols
      if (riskFilters.all) return true;
      
      // Get the risk category of this protocol
      const category = getRiskCategory(protocol.riskScore);
      
      // Only return protocols matching the selected category
      let shouldKeep = false;
      
      if (riskFilters.low && category === "low") {
        shouldKeep = true;
      }
      
      if (riskFilters.medium && category === "medium") {
        shouldKeep = true;
      }
      
      if (riskFilters.high && category === "high") {
        shouldKeep = true;
      }
      
      return shouldKeep;
    })
    .sort((a, b) => b.apy - a.apy) // Sort by APY (highest first)
    // Only limit to 4 if not showing all
    .slice(0, riskFilters.all ? undefined : 4);

  const getActiveFiltersLabel = () => {
    if (riskFilters.all) return "All Risks";
    if (riskFilters.low) return "Low Risk";
    if (riskFilters.medium) return "Medium Risk";
    if (riskFilters.high) return "High Risk";
    return "No Filter"; // Fallback, shouldn't happen
    
  }

  return (
    <>
      <div className="px-4 py-6">
        <div className="flex-col mb-6">
          <div className="relative py-1 flex justify-end">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-black'
              } transition-colors duration-200`}
            >
              <Filter className="w-4 h-4 mr-2" />
              {getActiveFiltersLabel()}
            </button>
            {showFilter && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="py-2 px-1">
                  <div className="flex items-center justify-between px-3 py-1">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Risk Categories
                    </p>
                    <button 
                      onClick={() => setShowFilter(false)}
                      className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <X className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                  </div>
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={() => toggleRiskFilter('all')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                        theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      } rounded-md`}
                    >
                      <span className="flex items-center">
                        <div className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                          riskFilters.all 
                            ? 'bg-green-500 border-green-500'
                            : `border-gray-400 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`
                        }`}>
                          {riskFilters.all && <Check className="w-3 h-3 text-white" />}
                        </div>
                        All Risks
                      </span>
                    </button>
                    <button
                      onClick={() => toggleRiskFilter('low')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-green-500 ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      } rounded-md`}
                    >
                      <span className="flex items-center">
                        <div className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                          riskFilters.low 
                            ? 'bg-green-500 border-green-500'
                            : `border-gray-400 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`
                        }`}>
                          {riskFilters.low && <Check className="w-3 h-3 text-white" />}
                        </div>
                        Low Risk (1-3)
                      </span>
                    </button>
                    <button
                      onClick={() => toggleRiskFilter('medium')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-yellow-500 ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      } rounded-md`}
                    >
                      <span className="flex items-center">
                        <div className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                          riskFilters.medium 
                            ? 'bg-yellow-500 border-yellow-500'
                            : `border-gray-400 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`
                        }`}>
                          {riskFilters.medium && <Check className="w-3 h-3 text-white" />}
                        </div>
                        Medium Risk (4-7)
                      </span>
                    </button>
                    <button
                      onClick={() => toggleRiskFilter('high')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-red-500 ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      } rounded-md`}
                    >
                      <span className="flex items-center">
                        <div className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                          riskFilters.high 
                            ? 'bg-red-500 border-red-500'
                            : `border-gray-400 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`
                        }`}>
                          {riskFilters.high && <Check className="w-3 h-3 text-white" />}
                        </div>
                        High Risk (8-10)
                      </span>
                    </button>
                  </div>
                  
                </div>
                
              </div>
            )}
          </div>
          <div className="flex items-center py-1">
            <Flame className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Suggested Pools</h2>
          </div>
        </div>
        <div className="space-y-4">
          {filteredProtocols.map((protocol) => (
            <div 
              key={`${protocol.id}-${protocol.pair}`}
              className={`flex flex-col cursor-pointer shadow-md ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100/50 hover:bg-gray-100'} p-5 rounded-xl transition-colors duration-200 relative h-[17vh]`}
              onClick={() => handleProtocolClick(protocol)}
            >
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                  <Image src={protocol.logo || "/placeholder.svg"} alt={protocol.name} width={56} height={56} />
                </div>
                <div className="flex-1">
                  <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {protocol.pair} <span className="text-sm font-normal opacity-70">({protocol.name})</span>
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{protocol.tvl} TVL</div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {protocol.apy.toFixed(2)}%
                </div>
                <div className={`font-semibold text-md ${getRiskColor(protocol.riskScore)}`}>
                  Risk: {getRiskLabel(protocol.riskScore)}
                </div>
              </div>
            </div>
          ))}

          {filteredProtocols.length === 0 && (
            <div className={`py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No pools match your selected risk filters
            </div>
          )}
        </div>
      </div>

      <DepositModal 
        pool={selectedPool}
        onClose={() => setSelectedPool(null)}
      />
    </>
  )
}
