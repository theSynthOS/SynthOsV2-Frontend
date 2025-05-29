"use client";

import {
  Flame,
  Filter,
  ArrowUpDown,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import DepositModal from "./deposit-modal";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Protocol {
  id: number;
  name: string;
  logo_url: string;
  description: string;
  created_at: string;
}

interface ProtocolPair {
  id: string;
  name: string;
  pair_or_vault_name: string;
  type: string;
  chain_id: number;
  contract_address: string;
  created_at: string;
  apy?: number;
}

export default function TrendingProtocols({
  refreshBalance,
}: {
  refreshBalance?: () => void;
}) {
  const { theme } = useTheme();
  const { isAuthenticated, address } = useAuth();
  const [selectedPool, setSelectedPool] = useState<any>(null);
  // const [riskFilters, setRiskFilters] = useState({
  //   all: true,
  //   low: false,
  //   medium: false,
  //   high: false,
  // });
  // const [showFilter, setShowFilter] = useState(false);
  const [investorProfile, setInvestorProfile] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [protocolPairs, setProtocolPairs] = useState<ProtocolPair[]>([]);
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(true);
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(
    new Set()
  );
  // const filterRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showApyInfo, setShowApyInfo] = useState(false);
  const apyInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // if (
      //   filterRef.current &&
      //   !filterRef.current.contains(event.target as Node)
      // ) {
      //   setShowFilter(false);
      // }
      
      if (
        apyInfoRef.current &&
        !apyInfoRef.current.contains(event.target as Node)
      ) {
        setShowApyInfo(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchProtocols = async () => {
      setIsLoadingProtocols(true);
      try {
        const response = await fetch("/api/protocols");
        if (!response.ok) {
          throw new Error("Failed to fetch protocols");
        }
        const data = await response.json();
        setProtocols(data);
      } catch (error) {
        console.error("Error fetching protocols:", error);
        setProtocols([]);
      } finally {
        setIsLoadingProtocols(false);
      }
    };

    fetchProtocols();
  }, []);

  useEffect(() => {
    const fetchProtocolPairsApy = async () => {
      try {
        const response = await fetch("/api/protocol-pairs-apy");
        if (!response.ok) {
          throw new Error("Failed to fetch protocol pairs");
        }
        const data = await response.json();
        setProtocolPairs(data);
      } catch (error) {
        console.error("Error fetching protocol pairs:", error);
        setProtocolPairs([]);
      }
    };

    fetchProtocolPairsApy();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setBalance("0");
        return;
      }

      setIsLoadingBalance(true);
      try {
        const response = await fetch(`/api/balance?address=${address}`);
        if (!response.ok) {
          throw new Error("Failed to fetch balance");
        }
        const data = await response.json();
        setBalance(data.usdBalance || "0");
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [address]);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("investor_profile");
      if (storedProfile) {
        setInvestorProfile(JSON.parse(storedProfile).title);
      } else {
        setInvestorProfile("Degen Learner");
      }
    } catch (error) {
      console.error("Error fetching investor profile:", error);
      setInvestorProfile("Degen Learner");
    }
  }, []);

  // const getRiskCategory = (type: string) => {
  //   // Placeholder risk level for now
  //   return "medium";
  // };

  // const getRiskLabel = (type: string) => {
  //   // Placeholder risk label for now
  //   return "Medium";
  // };

  // const getRiskColor = (type: string) => {
  //   // Placeholder risk color for now
  //   return "text-yellow-500";
  // };

  const handleProtocolClick = (protocol: any, pair: ProtocolPair) => {
    setSelectedPool({
      name: protocol.name,
      apy: 0,
      risk: "Medium",
      pair_or_vault_name: pair.pair_or_vault_name,
      protocol_id: protocol.id.toString(),
      protocol_pair_id: pair.id,
    });
  };

  // const toggleRiskFilter = (category: "all" | "low" | "medium" | "high") => {
  //   // Set only the selected filter to true, all others to false
  //   setRiskFilters({
  //     all: category === "all",
  //     low: category === "low",
  //     medium: category === "medium",
  //     high: category === "high",
  //   });

  //   // Close the filter menu after selection
  //   setShowFilter(false);
  // };

  // // Update the filtered protocols to use the API data
  // const filteredProtocols = protocols
  //   .filter((protocol) => {
  //     if (riskFilters.all) return true;
  //     return false; // No risk filtering for parent protocols
  //   })
  //   .slice(0, riskFilters.all ? undefined : 4);

  // const getActiveFiltersLabel = () => {
  //   if (riskFilters.all)
  //     return <span className="text-gray-700 dark:text-white">All Risks</span>;
  //   if (riskFilters.low)
  //     return <span className="text-purple-700 dark:text-purple-300">Low</span>;
  //   if (riskFilters.medium)
  //     return (
  //       <span className="text-purple-700 dark:text-purple-300">Medium</span>
  //     );
  //   if (riskFilters.high)
  //     return <span className="text-purple-700 dark:text-purple-300">High</span>;
  //   return (
  //     <span className="text-purple-700 dark:text-purple-300">No Filter</span>
  //   );
  // };

  const toggleProtocolExpand = (protocolName: string) => {
    setExpandedProtocols((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(protocolName)) {
        newSet.delete(protocolName);
      } else {
        newSet.add(protocolName);
      }
      return newSet;
    });
  };

  const getRiskLabel = (type: string) => {
    return "Medium";
  };

  const getRiskColor = (type: string) => {
    return "text-yellow-500";
  };

  const getProtocolPairs = (protocolName: string) => {
    return protocolPairs.filter(
      (pair) => pair.name.toLowerCase() === protocolName.toLowerCase()
    );
  };

  return (
    <>
      <div className="px-4 py-6">
        <div className="flex-col mb-6">
          <div className="relative py-1 flex justify-between items-center">
            {investorProfile && (
              <div
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  theme === "dark"
                    ? "bg-purple-900/30 text-purple-300"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {investorProfile}
              </div>
            )}

            {/* Risk Filter
            <div ref={filterRef}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  theme === "dark"
                    ? "bg-gray-800 hover:bg-gray-700 text-white"
                    : "bg-white hover:bg-gray-50 text-black border border-gray-200"
                } transition-colors duration-200`}
              >
                <Filter className="w-4 h-4 mr-2" />
                {getActiveFiltersLabel()}
              </button>
              {showFilter && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  } border ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="py-2 px-1">
                    <div className="flex items-center justify-between px-3 py-1">
                      <p
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Risk Categories
                      </p>
                      <button
                        onClick={() => setShowFilter(false)}
                        className={`p-1 rounded-full ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <X
                          className={`w-4 h-4 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="space-y-1 mt-1">
                      <button
                        onClick={() => toggleRiskFilter("all")}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <span className="flex items-center">
                          <div
                            className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                              riskFilters.all
                                ? "bg-purple-500 border-purple-500"
                                : `border-gray-400 ${
                                    theme === "dark"
                                      ? "bg-gray-700"
                                      : "bg-white"
                                  }`
                            }`}
                          >
                            {riskFilters.all && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span
                            className={
                              theme === "dark" ? "text-white" : "text-black"
                            }
                          >
                            All Risks
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={() => toggleRiskFilter("low")}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <span className="flex items-center">
                          <div
                            className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                              riskFilters.low
                                ? "bg-purple-500 border-purple-500"
                                : `border-gray-400 ${
                                    theme === "dark"
                                      ? "bg-gray-700"
                                      : "bg-white"
                                  }`
                            }`}
                          >
                            {riskFilters.low && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span
                            className={
                              theme === "dark" ? "text-white" : "text-gray-700"
                            }
                          >
                            Low
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={() => toggleRiskFilter("medium")}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <span className="flex items-center">
                          <div
                            className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                              riskFilters.medium
                                ? "bg-purple-500 border-purple-500"
                                : `border-gray-400 ${
                                    theme === "dark"
                                      ? "bg-gray-700"
                                      : "bg-white"
                                  }`
                            }`}
                          >
                            {riskFilters.medium && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span
                            className={
                              theme === "dark" ? "text-white" : "text-gray-700"
                            }
                          >
                            Medium
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={() => toggleRiskFilter("high")}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <span className="flex items-center">
                          <div
                            className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                              riskFilters.high
                                ? "bg-purple-500 border-purple-500"
                                : `border-gray-400 ${
                                    theme === "dark"
                                      ? "bg-gray-700"
                                      : "bg-white"
                                  }`
                            }`}
                          >
                            {riskFilters.high && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span
                            className={
                              theme === "dark" ? "text-white" : "text-gray-700"
                            }
                          >
                            High
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div> */}
          </div>
          <div className="flex items-center py-1 relative">
            <Flame
              className={`w-5 h-5 mr-2 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            />
            <h2
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Suggested Investments
            </h2>
            <button
              onClick={() => setShowApyInfo(!showApyInfo)}
              className={`ml-2 p-1 rounded-full hover:bg-opacity-20 ${
                theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-200"
              }`}
              aria-label="APY Information"
            >
              <Info className={`w-4 h-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`} />
            </button>
            
            {showApyInfo && (
              <div 
                ref={apyInfoRef}
                className={`absolute left-0 top-12 z-20 p-4 rounded-lg shadow-lg w-72 ${
                  theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-md">Testnet APY Information</h3>
                  <button
                    onClick={() => setShowApyInfo(false)}
                    className={`p-1 rounded-full ${
                      theme === "dark" 
                        ? "hover:bg-gray-700" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm">
                  The APY values shown are on testnet and may differ from mainnet rates.
                </p>
                <div className="mt-3 text-xs opacity-70">
                  All investments are simulated on Scroll Sepolia testnet.
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {isLoadingProtocols ? (
            <div className="flex flex-col gap-4 py-8">
              <Skeleton className="w-full h-24 rounded-sm bg-gray-300 dark:bg-gray-800" />
              <Skeleton className="w-full h-24 rounded-sm bg-gray-300 dark:bg-gray-800" />
            </div>
          ) : protocols.length === 0 ? (
            <div
              className={`py-8 text-center ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No protocols available
            </div>
          ) : (
            protocols.map((protocol) => (
              <div key={protocol.id} className={`mb-6 rounded-lg`}>
                <div
                  className={`flex flex-col cursor-pointer ${
                    theme === "dark"
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-white hover:bg-gray-50 shadow-sm"
                  } p-5 rounded-xl transition-colors duration-200 relative`}
                  onClick={() => toggleProtocolExpand(protocol.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden mr-4">
                        <Image
                          src={protocol.logo_url || ""}
                          alt={protocol.name}
                          width={100}
                          height={100}
                          onError={(e) => {
                            console.log(
                              "Image failed to load:",
                              protocol.logo_url
                            );
                          }}
                        />
                      </div>
                      <div>
                        <div
                          className={`text-lg font-semibold ${
                            theme === "dark" ? "text-white" : "text-black"
                          }`}
                        >
                          {protocol.name}
                        </div>
                        <div
                          className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {protocol.description}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-8 h-8 transition-transform duration-300 stroke-[2.5] ${
                        theme === "dark" ? "text-white" : "text-black"
                      } ${expandedProtocols.has(protocol.name) ? "rotate-180" : "rotate-0"}`}
                    />
                  </div>
                </div>
                {expandedProtocols.has(protocol.name) && (
                  <div className="mt-2 space-y-2 px-4">
                    {getProtocolPairs(protocol.name).map((pair) => (
                      <div
                        key={pair.id}
                        className={`flex flex-col cursor-pointer ${
                          theme === "dark"
                            ? "bg-gray-800/50 hover:bg-gray-700/50"
                            : "bg-white hover:bg-gray-50 shadow-sm"
                        } p-5 rounded-xl transition-colors duration-200 relative h-34`}
                        onClick={() => handleProtocolClick(protocol, pair)}
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                            <Image
                              src={protocol.logo_url || ""}
                              alt={pair.name}
                              width={56}
                              height={56}
                              onError={(e) => {
                                console.log("Image failed to load:", pair.name);
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div
                              className={`text-lg font-semibold ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              {pair.pair_or_vault_name}{" "}
                              <span className="text-sm font-normal opacity-70">
                                ({pair.name})
                              </span>
                            </div>
                            <div
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {pair.type.charAt(0).toUpperCase() +
                                pair.type.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-auto">
                          <div
                            className={`text-xl font-bold flex ${
                              theme === "dark" ? "text-white" : "text-black"
                            }`}
                          >
                            {pair.apy ? `${Number(pair.apy).toFixed(3)}%` : "N/A"}
                            <div
                              className={`text-sm items-center flex font-medium ml-2 ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              APY
                            </div>
                          </div>
                          <div
                            className={`font-semibold text-md ${getRiskColor(
                              pair.type
                            )}`}
                          >
                            Risk: {getRiskLabel(pair.type)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className={`flex flex-col ${
                    theme === "dark" ? "bg-gray-800/50" : "bg-white shadow-sm"
                  } p-5 rounded-xl mt-4`}
                >
                  <div className="flex items-center justify-center">
                    <div className="text-lg font-semibold text-black dark:text-white">
                      More investments coming on mainnet...
                    </div>
                  </div>
                </div>
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
        address={address || ""}
        refreshBalance={() => {
          if (address) {
            setIsLoadingBalance(true);
            fetch(`/api/balance?address=${address}`)
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Failed to fetch balance");
                }
                return response.json();
              })
              .then((data) => {
                setBalance(data.usdBalance || "0");
              })
              .catch((error) => {
                console.error("Error refreshing balance:", error);
              })
              .finally(() => {
                setIsLoadingBalance(false);
              });
          }
          if (refreshBalance) {
            refreshBalance();
          }
        }}
      />
    </>
  );
}