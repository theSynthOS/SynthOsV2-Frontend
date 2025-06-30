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
    all: true,
    low: false,
    medium: false,
    high: false,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [protocolPairs, setProtocolPairs] = useState<ProtocolPair[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApyInfo, setShowApyInfo] = useState(false);
  const apyInfoRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const fetchProtocolPairsApy = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/protocol-pairs-apy");
        if (!response.ok) {
          throw new Error("Failed to fetch protocol pairs");
        }
        const data = await response.json();
        const filteredPairs = data.filter(
          (pair: ProtocolPair) => pair.chain_id === 534352
        );
        setProtocolPairs(filteredPairs);
      } catch (error) {
        console.error("Error fetching protocol pairs:", error);
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
        console.error("Error fetching balance:", error);
        setBalance("0");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [account?.address]);

  useEffect(() => {
    const fetchInvestorProfile = async () => {
      if (!account?.address) {
        setInvestorProfile("Degen Learner");
        return;
      }
      setIsLoadingProfile(true);
      try {
        // First, try to get data from localStorage
        const storedProfile = localStorage.getItem("investor_profile");
        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          setInvestorProfile(parsedProfile.profile?.type || "Degen Learner");
          setIsLoadingProfile(false);
          return;
        }

        // If no cached data, make the API request
        const response = await fetch(
          `/api/ai-analyser?address=${account.address}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch investor profile");
        }
        const data = await response.json();
        localStorage.setItem("investor_profile", JSON.stringify(data));
        setInvestorProfile(data.profile?.type || "Degen Learner");
      } catch (error) {
        console.error("Error fetching investor profile:", error);
        setInvestorProfile("Degen Learner");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchInvestorProfile();
  }, [account?.address]);

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
  
  const toggleRiskFilter = (category: "all" | "low" | "medium" | "high") => {
    // Set only the selected filter to true, all others to false
    setRiskFilters({
      all: category === "all",
      low: category === "low",
      medium: category === "medium",
      high: category === "high",
    });

    // Close the filter menu after selection
    setShowFilter(false);
  };

  // Update the filtered protocols to use the API data and proper risk filtering
  const filteredProtocols = protocolPairs
    .filter((pair) => {
      if (riskFilters.all) return true;
      const riskCategory = getRiskCategory(pair.risk);
      if (riskFilters.low && riskCategory === "low") return true;
      if (riskFilters.medium && riskCategory === "medium") return true;
      if (riskFilters.high && riskCategory === "high") return true;
      return false;
    });

  const getActiveFiltersLabel = () => {
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
              <Skeleton className="h-8 w-32 xl:h-12 xl:w-52 rounded-sm bg-gray-300 dark:bg-gray-800" />
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
                } flex items-center justify-center border ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                } xl:bg-transparent xl:border-[#afabbc] xl:backdrop-blur-[75px] ${
                  theme === "dark"
                    ? "xl:shadow-[0px_0px_9px_1px_#402D86B2_inset]"
                    : ""
                } ${
                  theme === "dark"
                    ? "xl:hover:bg-[linear-gradient(90deg,rgba(7,2,25,0.3)_0%,rgba(92,50,248,0.3)_100%)] xl:hover:border-transparent"
                    : "xl:hover:bg-[#8266E6] xl:hover:border-[#8266E6]"
                }`}
              >
                <Filter
                  className={`w-4 h-4 mr-2 transition-colors duration-200 ${
                    theme === "dark" ? "text-gray-400" : "text-[#8266E6]"
                  } group-hover:text-white`}
                />
                <span
                  className={` text-sm  xl:text-[20px] font-medium transition-colors duration-200 ${
                    theme === "dark"
                      ? "text-gray-400"
                      : "text-black group-hover:text-white"
                  }`}
                >
                  {getActiveFiltersLabel()}
                </span>
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
                              theme === "dark" ? "text-white" : "text-gray-700"
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
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
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
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
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
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 py-8">
              <Skeleton className="w-full h-40 xl:h-52 rounded-xl bg-gray-300 dark:bg-gray-800" />
              <Skeleton className="w-full h-40 xl:h-52 rounded-xl bg-gray-300 dark:bg-gray-800" />
            </div>
          ) : protocolPairs.length === 0 ? (
            <div
              className={`py-8 text-center ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No investment options available
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

          // Trigger holdings refresh by dispatching a custom event
          window.dispatchEvent(new CustomEvent("refreshHoldings"));
        }}
      />
    </>
  );
}
