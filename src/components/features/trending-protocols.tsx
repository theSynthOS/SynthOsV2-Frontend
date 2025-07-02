"use client";

import React from "react";
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
import { useActiveAccount } from "thirdweb/react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtocolPair {
  id: string;
  name: string;
  pair_or_vault_name: string;
  type: string;
  chain_id: number;
  contract_address: string;
  created_at: string;
  apy?: number;
  protocol_id: string;
  logo_url: string;
  risk: string;
}

interface TrendingProtocolsProps {
  refreshBalance?: () => void;
  renderFeedbackButton?: () => React.ReactNode;
}

export default function TrendingProtocols({
  refreshBalance,
  renderFeedbackButton,
}: TrendingProtocolsProps) {
  const { theme } = useTheme();
  const account = useActiveAccount();
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [investorProfile, setInvestorProfile] = useState<string | null>(null);
  const [riskFilters, setRiskFilters] = useState({
    top: false,
    all: true, // Default to showing all protocols immediately
    low: false,
    medium: false,
    high: false,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [protocolPairs, setProtocolPairs] = useState<ProtocolPair[]>([]);
  const [aiRecommendedProtocols, setAiRecommendedProtocols] = useState<
    ProtocolPair[]
  >([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApyInfo, setShowApyInfo] = useState(false);
  const apyInfoRef = useRef<HTMLDivElement>(null);
  const [topOpportunities, setTopOpportunities] = useState<any[]>([]);
  const [topOpportunityIds, setTopOpportunityIds] = useState<string[]>([]);
  const [isLoadingTopOpportunities, setIsLoadingTopOpportunities] =
    useState(false);

  // Cleanup cache when wallet disconnects
  useEffect(() => {
    if (!account?.address) {
      // Clear any cached data for the current session when wallet disconnects
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (
          key.startsWith("investor_profile_") ||
          key.startsWith("top_opportunities_")
        ) {
          // Only remove if it's old data (optional - you might want to keep it)
          try {
            const data = JSON.parse(localStorage.getItem(key) || "{}");
            const now = Date.now();
            const dayOld = 24 * 60 * 60 * 1000;
            if (now - data.timestamp > dayOld) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
    }
  }, [account?.address]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false);
      }
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

  // Fetch all protocol pairs on component mount for immediate display
  useEffect(() => {
    const fetchProtocolPairsApy = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/protocol-pairs-apy");

        if (!response.ok) {
          throw new Error(`Failed to fetch protocol pairs: ${response.status}`);
        }
        const data = await response.json();

        const filteredPairs = data.filter(
          (pair: ProtocolPair) => pair.chain_id === 534352
        );
        console.log(
          "⚡ Filtered pairs for chain 534352:",
          filteredPairs.length
        );

        setProtocolPairs(filteredPairs);
      } catch (error) {
        setProtocolPairs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProtocolPairsApy();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account?.address) {
        setBalance("0");
        return;
      }

      setIsLoadingBalance(true);
      try {
        const response = await fetch(`/api/balance?address=${account.address}`);
        if (!response.ok) {
          throw new Error("Failed to fetch balance");
        }
        const data = await response.json();
        setBalance(data.usdBalance || "0");
      } catch (error) {
        setBalance("0.00");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [account?.address]);

  useEffect(() => {
    const fetchInvestorProfile = async () => {
      if (!account?.address) {
        setInvestorProfile("Error fetching investor profile");
        return;
      }

      // Check localStorage for cached profile data
      const cacheKey = `investor_profile_${account.address}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const { profile, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          // If cache is still valid (less than 24 hours old)
          if (now - timestamp < cacheExpiry) {
            setInvestorProfile(profile);
            setIsLoadingProfile(false);
            return;
          }
        } catch (error) {
          // Invalid cached data, remove it
          localStorage.removeItem(cacheKey);
        }
      }

      setIsLoadingProfile(true);
      try {
        const response = await fetch(
          `/api/ai-analyser?address=${account.address}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch investor profile");
        }
        const data = await response.json();

        const profileType = data.profile?.type || null;
        setInvestorProfile(profileType);

        // Cache the result in localStorage
        if (profileType) {
          const cacheData = {
            profile: profileType,
            timestamp: Date.now(),
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        }
      } catch (error) {
        setInvestorProfile("Error fetching investor profile");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchInvestorProfile();
  }, [account?.address]);

  useEffect(() => {
    const fetchTopOpportunities = async () => {
      if (!account?.address) {
        setTopOpportunities([]);
        setTopOpportunityIds([]);
        return;
      }

      // Check localStorage for cached top opportunities data
      const cacheKey = `top_opportunities_${account.address}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const { opportunities, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          // If cache is still valid (less than 24 hours old)
          if (now - timestamp < cacheExpiry) {
            setTopOpportunities(opportunities);
            // Extract protocol_id from localStorage opportunities format and clean asterisks
            const protocolIds = opportunities.map((op: any) => {
              // Remove asterisks from protocol_id if they exist
              return op.protocol_id?.replace(/\*/g, "") || op.protocol_id;
            });
            setTopOpportunityIds(protocolIds);
            setIsLoadingTopOpportunities(false);
            return;
          }
        } catch (error) {
          // Invalid cached data, remove it
          localStorage.removeItem(cacheKey);
        }
      }

      setIsLoadingTopOpportunities(true);
      try {
        const response = await fetch(
          `/api/ai-analyser?address=${account.address}`
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        // Extract from quickActions from API response
        const quickActions = data.investmentOpportunities?.quickActions || [];

        setTopOpportunities(quickActions);
        // Extract protocol_id from quickActions and clean asterisks
        const protocolIds = quickActions.map((action: any) => {
          // Remove asterisks from protocol_id if they exist
          return action.protocol_id?.replace(/\*/g, "") || action.protocol_id;
        });
        setTopOpportunityIds(protocolIds);

        // Cache the result in localStorage using opportunities format
        if (quickActions.length > 0) {
          const cacheData = {
            opportunities: quickActions,
            timestamp: Date.now(),
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        }
      } catch (error) {
        setTopOpportunities([]);
        setTopOpportunityIds([]);
      } finally {
        setIsLoadingTopOpportunities(false);
      }
    };
    fetchTopOpportunities();
  }, [account?.address]);

  // Fetch individual protocol details when AI recommendations are available
  useEffect(() => {
    const fetchAiRecommendedProtocolDetails = async () => {
      if (topOpportunityIds.length === 0) {
        setAiRecommendedProtocols([]);
        return;
      }

      try {
        // Fetch all protocol details in parallel
        const protocolPromises = topOpportunityIds.map(async (protocolId) => {
          try {
            const response = await fetch(
              `/api/protocol-pairs-apy/${protocolId}`
            );

            if (!response.ok) {
              return null;
            }

            const protocol = await response.json();
            return protocol;
          } catch (error) {
            return null;
          }
        });

        const results = await Promise.all(protocolPromises);
        const validProtocols = results.filter(
          (protocol): protocol is ProtocolPair =>
            protocol !== null && protocol.chain_id === 534352
        );

        setAiRecommendedProtocols(validProtocols);
      } catch (error) {
        setAiRecommendedProtocols([]);
      }
    };

    fetchAiRecommendedProtocolDetails();
  }, [topOpportunityIds]);

  const handleProtocolClick = (pair: ProtocolPair) => {
    setSelectedPool({
      name: pair.name,
      apy: pair.apy || 0,
      risk: pair.risk,
      pair_or_vault_name: pair.pair_or_vault_name,
      protocol_id: pair.protocol_id.toString(),
      protocol_pair_id: pair.id,
      logo_url: pair.logo_url,
    });
  };

  const getRiskCategory = (risk: string) => {
    return risk.toLowerCase();
  };

  const getRiskLabel = (risk: string) => {
    return risk;
  };

  const getRiskColor = (risk: string) => {
    const riskLower = risk.toLowerCase();
    switch (riskLower) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const toggleRiskFilter = (
    category: "top" | "all" | "low" | "medium" | "high"
  ) => {
    setRiskFilters({
      top: category === "top",
      all: category === "all",
      low: category === "low",
      medium: category === "medium",
      high: category === "high",
    });
    setShowFilter(false);
  };

  let filteredProtocols: any[] = [];
  if (riskFilters.top) {
    filteredProtocols = aiRecommendedProtocols;
  } else {
    filteredProtocols = protocolPairs.filter((pair) => {
      if (riskFilters.all) return true;
      const riskCategory = getRiskCategory(pair.risk);
      if (riskFilters.low && riskCategory === "low") return true;
      if (riskFilters.medium && riskCategory === "medium") return true;
      if (riskFilters.high && riskCategory === "high") return true;
      return false;
    });
  }

  const getActiveFiltersLabel = () => {
    if (riskFilters.top)
      return (
        <span className="block text-left text-purple-700 dark:text-purple-300">
          AI Recommendations
        </span>
      );
    if (riskFilters.all)
      return <span className="text-gray-700 dark:text-white ">All Risks</span>;
    if (riskFilters.low)
      return <span className="text-purple-700 dark:text-purple-300">Low</span>;
    if (riskFilters.medium)
      return (
        <span className="text-purple-700 dark:text-purple-300">Medium</span>
      );
    if (riskFilters.high)
      return <span className="text-purple-700 dark:text-purple-300">High</span>;
    return (
      <span className="text-purple-700 dark:text-purple-300">No Filter</span>
    );
  };

  return (
    <>
      <div
        className={`px-6 py-6 ${
          theme === "dark" ? "bg-[#1E1E1ECC]" : "bg-[#FFFFFFA6]"
        } rounded-b-2xl`}
      >
        <div className="flex-col mb-6">
          <div className="relative py-1 flex justify-between items-center">
            {isLoadingProfile ? (
              <div
                className={`px-4 py-2 xl:py-3 rounded-lg text-sm xl:text-lg font-normal flex items-center ${
                  theme === "dark"
                    ? "bg-[#7266E61A] text-white"
                    : "bg-[#7266E61A] text-black"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        theme === "dark" ? "bg-purple-400" : "bg-purple-600"
                      }`}
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        theme === "dark" ? "bg-purple-400" : "bg-purple-600"
                      }`}
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        theme === "dark" ? "bg-purple-400" : "bg-purple-600"
                      }`}
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span className="text-sm xl:text-lg font-medium">
                    AI Analyzing Your Profile...
                  </span>
                </div>
              </div>
            ) : investorProfile ? (
              <div
                className={`px-4 py-2 xl:py-3 rounded-lg text-sm xl:text-lg font-normal ${
                  theme === "dark"
                    ? "bg-[#7266E61A] text-white"
                    : "bg-[#7266E61A] text-black"
                }`}
              >
                {investorProfile}
              </div>
            ) : null}
            <div ref={filterRef}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`px-2 py-2 xl:px-3 xl:py-4 rounded-lg transition-all duration-200 group ${
                  theme === "dark" ? "bg-[#1E1E1E]" : "bg-white"
                } flex items-center justify-start border ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                } xl:bg-transparent xl:border-[#afabbc] xl:backdrop-blur-[75px] ${
                  theme === "dark"
                    ? "xl:shadow-[0px_0px_9px_1px_#402D86B2_inset]"
                    : ""
                } ${
                  theme === "dark"
                    ? "xl:hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] xl:hover:border-transparent"
                    : "xl:hover:bg-[#8266E6] xl:hover:border-[#8266E6]"
                } `}
              >
                <Filter
                  className={`w-4 h-4 mr-2 transition-colors duration-200 ${
                    theme === "dark" ? "text-gray-400" : "text-[#8266E6]"
                  } group-hover:text-white flex-shrink-0`}
                />
                <span
                  className={`text-sm xl:text-[20px] font-medium transition-colors duration-200 text-left ${
                    theme === "dark"
                      ? "text-gray-400"
                      : "text-black group-hover:text-white"
                  } truncate`}
                >
                  {getActiveFiltersLabel()}
                </span>
              </button>
              {showFilter && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-10 ${
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
                        Sort By
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
                        onClick={() => toggleRiskFilter("top")}
                        disabled={isLoadingProfile && !investorProfile}
                        className={`w-full flex items-center justify-start px-4 py-2 text-sm ${
                          isLoadingProfile && !investorProfile
                            ? "opacity-50 cursor-not-allowed"
                            : theme === "dark"
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <div
                          className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                            riskFilters.top
                              ? "bg-purple-500 border-purple-500"
                              : `border-gray-400 ${
                                  theme === "dark" ? "bg-gray-700" : "bg-white"
                                }`
                          }`}
                        >
                          {riskFilters.top && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span
                          className={`text-left ${
                            theme === "dark" ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {isLoadingProfile && !investorProfile
                            ? "Analyzing Profile..."
                            : "AI Recommendations"}
                        </span>
                      </button>
                      <button
                        onClick={() => toggleRiskFilter("all")}
                        className={`w-full flex items-center justify-start px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <div
                          className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                            riskFilters.all
                              ? "bg-purple-500 border-purple-500"
                              : `border-gray-400 ${
                                  theme === "dark" ? "bg-gray-700" : "bg-white"
                                }`
                          }`}
                        >
                          {riskFilters.all && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span
                          className={`text-left ${
                            theme === "dark" ? "text-white" : "text-gray-700"
                          }`}
                        >
                          All Risks
                        </span>
                      </button>
                      <button
                        onClick={() => toggleRiskFilter("low")}
                        className={`w-full flex items-center justify-start px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <div
                          className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                            riskFilters.low
                              ? "bg-purple-500 border-purple-500"
                              : `border-gray-400 ${
                                  theme === "dark" ? "bg-gray-700" : "bg-white"
                                }`
                          }`}
                        >
                          {riskFilters.low && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span
                          className={`text-left ${
                            theme === "dark" ? "text-white" : "text-gray-700"
                          }`}
                        >
                          Low
                        </span>
                      </button>
                      <button
                        onClick={() => toggleRiskFilter("medium")}
                        className={`w-full flex items-center justify-start px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <div
                          className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                            riskFilters.medium
                              ? "bg-purple-500 border-purple-500"
                              : `border-gray-400 ${
                                  theme === "dark" ? "bg-gray-700" : "bg-white"
                                }`
                          }`}
                        >
                          {riskFilters.medium && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span
                          className={`text-left ${
                            theme === "dark" ? "text-white" : "text-gray-700"
                          }`}
                        >
                          Medium
                        </span>
                      </button>
                      <button
                        onClick={() => toggleRiskFilter("high")}
                        className={`w-full flex items-center justify-start px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        } rounded-md`}
                      >
                        <div
                          className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${
                            riskFilters.high
                              ? "bg-purple-500 border-purple-500"
                              : `border-gray-400 ${
                                  theme === "dark" ? "bg-gray-700" : "bg-white"
                                }`
                          }`}
                        >
                          {riskFilters.high && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span
                          className={`text-left ${
                            theme === "dark" ? "text-white" : "text-gray-700"
                          }`}
                        >
                          High
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center py-1 relative mt-4">
            <Flame
              className={`w-5 h-5 mr-2 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            />
            <h2
              className={`text-xl xl:text-lg font-light ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Suggested Investments
            </h2>
          </div>
        </div>
        <div className="space-y-4 xl:grid xl:grid-cols-2 xl:gap-4 xl:space-y-0">
          {isLoading ? (
            <>
              <div
                className={`flex flex-col ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-[#3C229C]/40 to-[#0B0424]/40"
                    : "bg-[#FDFDFF] shadow-sm"
                } p-5 rounded-xl`}
              >
                <div className="flex items-center mb-4">
                  <Skeleton className="w-14 h-14 rounded-full mr-4 bg-gray-300 dark:bg-gray-700" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2 bg-gray-300 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-20 bg-gray-300 dark:bg-gray-700" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-8 w-16 bg-gray-300 dark:bg-gray-700" />
                  <Skeleton className="h-6 w-20 bg-gray-300 dark:bg-gray-700" />
                </div>
              </div>
              <div
                className={`flex flex-col ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-[#3C229C]/40 to-[#0B0424]/40"
                    : "bg-[#FDFDFF] shadow-sm"
                } p-5 rounded-xl`}
              >
                <div className="flex items-center mb-4">
                  <Skeleton className="w-14 h-14 rounded-full mr-4 bg-gray-300 dark:bg-gray-700" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2 bg-gray-300 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-20 bg-gray-300 dark:bg-gray-700" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-8 w-16 bg-gray-300 dark:bg-gray-700" />
                  <Skeleton className="h-6 w-20 bg-gray-300 dark:bg-gray-700" />
                </div>
              </div>
            </>
          ) : protocolPairs.length === 0 ? (
            <div
              className={`py-8 text-center ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No investment options available
            </div>
          ) : filteredProtocols.length === 0 && riskFilters.top ? (
            <div
              className={`py-8 text-center ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {isLoadingTopOpportunities ||
              (topOpportunityIds.length > 0 &&
                aiRecommendedProtocols.length === 0)
                ? "Loading personalized recommendations..."
                : topOpportunityIds.length === 0
                ? "Analysis is still in progress"
                : "No matching protocols found for your profile"}
            </div>
          ) : (
            filteredProtocols
              .filter(
                (pair) =>
                  pair.apy !== undefined && pair.apy !== null && pair.apy > 0
              )
              .sort((a, b) => {
                const isAUsdc = a.pair_or_vault_name
                  .toLowerCase()
                  .includes("usdc");
                const isBUsdc = b.pair_or_vault_name
                  .toLowerCase()
                  .includes("usdc");

                if (isAUsdc && !isBUsdc) return -1;
                if (!isAUsdc && isBUsdc) return 1;

                return (b.apy || 0) - (a.apy || 0);
              })
              .map((pair) => (
                <div
                  key={pair.id}
                  className={`flex flex-col ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-[#3C229C]/40 to-[#0B0424]/40 hover:from-[#0B0424]/60 hover:to-[#3C229C]/60"
                      : "bg-[#FDFDFF] hover:bg-gray-50 shadow-sm"
                  } p-5 rounded-xl transition-colors duration-200 relative cursor-pointer`}
                  style={{
                    ...(theme === "dark" && {
                      backdropFilter: "blur(72px)",
                      boxShadow: "0px 0px 8px 0.8px #402D86 inset",
                      border: "1.6px solid",
                      borderImageSource:
                        "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%)",
                    }),
                  }}
                  onClick={() => handleProtocolClick(pair)}
                >
                  <div className="flex items-center mb-4">
                    <div className="min-w-14 h-14 rounded-full overflow-hidden mr-4">
                      <Image
                        src={pair.logo_url || ""}
                        alt={pair.name}
                        width={56}
                        height={56}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-lg font-semibold flex justify-between`}
                      >
                        <div className="pr-2">
                          {pair.pair_or_vault_name}{" "}
                          <span className="text-sm font-normal opacity-70">
                            ({pair.name})
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {pair.type.charAt(0).toUpperCase() + pair.type.slice(1)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div
                      className={`text-xl font-bold flex flex-wrap ${
                        theme === "dark" ? "text-white" : "text-black"
                      }`}
                    >
                      {`${
                        Number(pair.apy) % 1 === 0
                          ? Number(pair.apy).toFixed(0)
                          : Number(pair.apy).toFixed(2)
                      }%`}
                      <div
                        className={`text-sm items-center flex font-medium ml-2 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        APY
                      </div>
                    </div>
                    <div
                      className={`font-semibold text-md whitespace-nowrap ${getRiskColor(
                        pair.risk
                      )}`}
                    >
                      Risk: {getRiskLabel(pair.risk)}
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
        address={account?.address || ""}
        refreshBalance={() => {
          if (account?.address) {
            setIsLoadingBalance(true);
            fetch(`/api/balance?address=${account?.address}`)
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Failed to fetch balance");
                }
                return response.json();
              })
              .then((data) => {
                setBalance(data.usdBalance || "0");
              })
              .catch(() => {
                // Error handling
              })
              .finally(() => {
                setIsLoadingBalance(false);
              });
          }
          if (refreshBalance) {
            refreshBalance();
          }

          // Trigger holdings refresh by dispatching a custom event
          window.dispatchEvent(new CustomEvent("refreshHoldings"));
        }}
      />
    </>
  );
}
