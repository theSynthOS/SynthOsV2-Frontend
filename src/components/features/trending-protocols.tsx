"use client"

import { Flame, Filter, ArrowUpDown, Check, X, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import DepositModal from "./deposit-modal"
import { useAuth } from "@/contexts/AuthContext"

interface Protocol {
  id: number
  name: string
  logo_url: string
  description: string
  created_at: string
}

interface ProtocolPair {
  id: string
  name: string
  pair_or_vault_name: string
  type: string
  chain_id: number
  contract_address: string
  created_at: string
}

export default function TrendingProtocols() {
  const { theme } = useTheme()
  const { isAuthenticated, address } = useAuth()
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [riskFilters, setRiskFilters] = useState({
    all: true,
    low: false,
    medium: false,
    high: false
  })
  const [showFilter, setShowFilter] = useState(false)
  const [investorProfile, setInvestorProfile] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [protocolPairs, setProtocolPairs] = useState<ProtocolPair[]>([])
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(true)
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(new Set())
  
  // Fetch parent protocols
  useEffect(() => {
    const fetchProtocols = async () => {
      setIsLoadingProtocols(true)
      try {
        const response = await fetch('/api/protocols')
        if (!response.ok) {
          throw new Error('Failed to fetch protocols')
        }
        const data = await response.json()
        setProtocols(data)
      } catch (error) {
        console.error('Error fetching protocols:', error)
        setProtocols([])
      } finally {
        setIsLoadingProtocols(false)
      }
    }

    fetchProtocols()
  }, [])

  // Fetch protocol pairs
  useEffect(() => {
    const fetchProtocolPairs = async () => {
      try {
        const response = await fetch('/api/protocol-pairs')
        if (!response.ok) {
          throw new Error('Failed to fetch protocol pairs')
        }
        const data = await response.json()
        setProtocolPairs(data)
      } catch (error) {
        console.error('Error fetching protocol pairs:', error)
        setProtocolPairs([])
      }
    }

    fetchProtocolPairs()
  }, [])
  
  // Fetch balance when address changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setBalance("0")
        return
      }

      setIsLoadingBalance(true)
      try {
        const response = await fetch(`/api/balance?address=${address}`)
        if (!response.ok) {
          throw new Error('Failed to fetch balance')
        }
        const data = await response.json()
        setBalance(data.usdBalance || "0")
      } catch (error) {
        console.error('Error fetching balance:', error)
        setBalance("0")
      } finally {
        setIsLoadingBalance(false)
      }
    }

    fetchBalance()
  }, [address])
  
  // Fetch investor profile from localStorage on component mount
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("investor_profile")
      if (storedProfile) {
        setInvestorProfile(JSON.parse(storedProfile).title)
      } else {
        // Default profile if none is found
        setInvestorProfile("Degen Learner")
      }
    } catch (error) {
      console.error("Error fetching investor profile:", error)
      setInvestorProfile("Degen Learner")
    }
  }, [])
  
  const getRiskCategory = (type: string) => {
    // Placeholder risk level for now
    return "medium";
  }

  const getRiskLabel = (type: string) => {
    // Placeholder risk label for now
    return "Medium";
  }

  const getRiskColor = (type: string) => {
    // Placeholder risk color for now
    return "text-yellow-500";
  }

  const handleProtocolClick = (protocol: any, pair: ProtocolPair) => {
    setSelectedPool({
      name: protocol.name,
      apy: 0, // You might want to fetch this from another API endpoint
      risk: "Medium", // Placeholder risk for now
      pair_or_vault_name: pair.pair_or_vault_name,
      protocol_id: protocol.id.toString(),
      protocol_pair_id: pair.id
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

  // Update the filtered protocols to use the API data
  const filteredProtocols = protocols
    .filter(protocol => {
      if (riskFilters.all) return true;
      return false; // No risk filtering for parent protocols
    })
    .slice(0, riskFilters.all ? undefined : 4);

  const getActiveFiltersLabel = () => {
    if (riskFilters.all) return "All Risks";
    if (riskFilters.low) return "Low";
    if (riskFilters.medium) return "Medium";
    if (riskFilters.high) return "High";
    return "No Filter"; // Fallback, shouldn't happen
    
  }

  const toggleProtocolExpand = (protocolName: string) => {
    setExpandedProtocols(prev => {
      const newSet = new Set(prev)
      if (newSet.has(protocolName)) {
        newSet.delete(protocolName)
      } else {
        newSet.add(protocolName)
      }
      return newSet
    })
  }

  const getProtocolPairs = (protocolName: string) => {
    return protocolPairs.filter(pair => 
      pair.name.toLowerCase() === protocolName.toLowerCase()
    )
  }

  return (
    <>
      <div className="px-4 py-6">
        <div className="flex-col mb-6">
          <div className="relative py-1 flex justify-between items-center">
            {/* Investor Profile Badge */}
            {investorProfile && (
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                theme === 'dark' 
                  ? 'bg-purple-900/30 text-purple-300' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {investorProfile}
              </div>
            )}
            
            {/* Risk Filter */}
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
                        Low
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
                        Medium
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
                        High
                      </span>
                    </button>
                  </div>
                  
                </div>
                
              </div>
            )}
          </div>
          <div className="flex items-center py-1">
            <Flame className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Suggested Investments</h2>
          </div>
        </div>
        <div className="space-y-4">
          {isLoadingProtocols ? (
            <div className="flex justify-center items-center py-8">
              <div className="h-8 w-8 border-4 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
            </div>
          ) : protocols.length === 0 ? (
            <div className={`py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No protocols available
            </div>
          ) : (
            protocols.map((protocol) => (
              <div key={protocol.id}>
                <div 
                  className={`flex flex-col cursor-pointer shadow-md ${
                    theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100/50 hover:bg-gray-100'
                  } p-5 rounded-xl transition-colors duration-200 relative`}
                  onClick={() => toggleProtocolExpand(protocol.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                        <Image 
                          src={protocol.logo_url || "/placeholder.svg"} 
                          alt={protocol.name} 
                          width={56} 
                          height={56}
                          onError={(e) => {
                            console.log('Image failed to load:', protocol.logo_url);
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      <div>
                        <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {protocol.name}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {protocol.description}
                        </div>
                      </div>
                    </div>
                    {expandedProtocols.has(protocol.name) ? (
                      <ChevronUp className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                    ) : (
                      <ChevronDown className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                    )}
                  </div>
                </div>

                {/* Protocol Pairs */}
                {expandedProtocols.has(protocol.name) && (
                  <div className="mt-2 space-y-2 pl-4">
                    {getProtocolPairs(protocol.name).map((pair) => (
                      <div 
                        key={pair.id}
                        className={`flex flex-col cursor-pointer shadow-md ${
                          theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-gray-100/30 hover:bg-gray-100'
                        } p-5 rounded-xl transition-colors duration-200 relative h-34`}
                        onClick={() => handleProtocolClick(protocol, pair)}
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                            <Image 
                              src={protocol.logo_url || "/placeholder.svg"} 
                              alt={pair.name} 
                              width={56} 
                              height={56}
                              onError={(e) => {
                                console.log('Image failed to load:', protocol.logo_url);
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                              {pair.pair_or_vault_name} <span className="text-sm font-normal opacity-70">({pair.name})</span>
                            </div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {pair.type.charAt(0).toUpperCase() + pair.type.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-auto">
                          <div className={`text-xl font-bold flex ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            N/A
                            <div className={`text-sm items-center flex font-medium ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>APY</div>
                          </div>
                          <div className={`font-semibold text-md ${getRiskColor(pair.type)}`}>
                            Risk: {getRiskLabel(pair.type)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <DepositModal 
        pool={selectedPool}
        onClose={() => setSelectedPool(null)}
        balance={balance}
        isLoadingBalance={isLoadingBalance}
        address={address || ''}
      />
    </>
  )
}
