"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowRight, Upload, X } from "lucide-react";
import { MoveUp, MoveDown, Send, Copy, Check, Users, Gift } from "lucide-react";
import WalletDeposit from "@/components/features/wallet-deposit";
import SendModal from "@/components/features/wallet-send";
import BuyModal from "@/components/features/wallet-buy";
import { usePrivy } from "@privy-io/react-auth";
import { useTheme } from "next-themes";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import {
  safeHaptic,
  copyHaptic,
  mediumHaptic,
  heavyHaptic,
  errorHaptic,
} from "@/lib/haptic-utils";
import HoldingCard from "@/components/ui/holding-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import Card from "@/components/ui/card";

type Holding = {
  protocolPairId: string;
  protocolName: string;
  pairName: string;
  currentAmount: number;
  initialAmount: number;
  pnl: number;
  apy: number;
  status: string;
  protocolLogo: string;
  risk: string;
};

export default function HoldingPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const controls = useAnimation();
  const [copied, setCopied] = useState(false);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  // Use Privy for wallet authentication
  const { user, authenticated, login } = usePrivy();
  const {
    displayAddress,
    smartWalletClient,
    isSmartWalletActive,
    smartWalletAddress,
    embeddedWalletAddress,
  } = useSmartWallet();

  // Use display address from context
  const account =
    authenticated && displayAddress ? { address: displayAddress } : null;

  // View All modal state
  const [showViewAllModal, setShowViewAllModal] = useState(false);

  // Lock background scroll when View All modal is open
  useEffect(() => {
    if (showViewAllModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showViewAllModal]);

  // Set mounted to true on initial load to enable theme rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Display address is now managed by the context

  // Fetch holdings for one or more addresses and merge
  const fetchHoldings = async (overrideAddress?: string) => {
    const addresses: string[] = [];
    if (overrideAddress) {
      addresses.push(overrideAddress);
    } else {
      if (smartWalletAddress) addresses.push(smartWalletAddress);
      if (embeddedWalletAddress && embeddedWalletAddress !== smartWalletAddress)
        addresses.push(embeddedWalletAddress);
      // Fallback to displayAddress so EOA-only users still fetch holdings
      if (addresses.length === 0 && displayAddress)
        addresses.push(displayAddress);
    }

    if (addresses.length === 0) return;

    setIsLoading(true);
    try {
      const results = await Promise.all(
        addresses.map(async (addr) => {
          const res = await fetch(`/api/holdings?address=${addr}`);
          try {
            return await res.json();
          } catch {
            return [] as any[];
          }
        })
      );

      // Merge holdings by protocolPairId across addresses (sum amounts)
      const merged = new Map<string, any>();
      for (const list of results) {
        if (Array.isArray(list)) {
          for (const h of list) {
            const key = String(
              h.protocolPairId ?? `${h.protocolName}-${h.pairName}`
            );
            const existing = merged.get(key);
            if (!existing) {
              merged.set(key, h);
            } else {
              merged.set(key, {
                ...existing,
                // Sum amounts and pnl across wallets
                currentAmount:
                  Number(existing.currentAmount || 0) +
                  Number(h.currentAmount || 0),
                initialAmount:
                  Number(existing.initialAmount || 0) +
                  Number(h.initialAmount || 0),
                pnl: Number(existing.pnl || 0) + Number(h.pnl || 0),
                // Prefer non-empty protocolLogo/name fields
                protocolLogo: existing.protocolLogo || h.protocolLogo,
                protocolName: existing.protocolName || h.protocolName,
                pairName: existing.pairName || h.pairName,
                apy: existing.apy ?? h.apy,
                status: existing.status || h.status,
                risk: existing.risk || h.risk,
              });
            }
          }
        }
      }
      setHoldings(Array.from(merged.values()));
    } catch (error) {
      setHoldings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch holdings data on mount and address change
  useEffect(() => {
    fetchHoldings();
  }, [account?.address]);

  // Immediately clear holdings and related UI when user logs out or no address
  useEffect(() => {
    if (!authenticated || !account?.address) {
      setHoldings([]);
      setIsLoading(false);
    }
  }, [authenticated, account?.address]);

  // Listen for holdings refresh events
  useEffect(() => {
    const handleRefreshHoldings = (event: Event) => {
      const customEvent = event as CustomEvent<{ address?: string }>;
      const targetAddress = customEvent?.detail?.address;
      fetchHoldings(targetAddress);
    };

    window.addEventListener(
      "refreshHoldings",
      handleRefreshHoldings as EventListener
    );

    return () => {
      window.removeEventListener(
        "refreshHoldings",
        handleRefreshHoldings as EventListener
      );
    };
  }, []);

  // Filter out holdings with extremely small balances (1e-10 and smaller) and zero initial amounts

  const filteredHoldings = holdings.filter((h) => {
    // Keep if either current or initial is meaningful
    const hasVisibleCurrentAmount = Math.abs(h.currentAmount) >= 1e-6;
    const hasVisibleInitialAmount = Math.abs(h.initialAmount) >= 1e-6;
    return hasVisibleCurrentAmount || hasVisibleInitialAmount;
  });

  // Calculate total holding and pnl using filtered holdings
  const totalHolding = filteredHoldings.reduce(
    (sum, h) => sum + (h.currentAmount || 0),
    0
  );
  const totalPnl = filteredHoldings.reduce((sum, h) => sum + (h.pnl || 0), 0);

  // Format PnL with intelligent decimal places (for total PnL display)
  const formatPnl = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue === 0) return "0.00";
    if (absValue >= 0.01) return absValue.toFixed(2);
    if (absValue >= 0.001) return absValue.toFixed(3);
    if (absValue >= 0.0001) return absValue.toFixed(4);
    if (absValue >= 0.00001) return absValue.toFixed(5);
    if (absValue >= 0.000001) return absValue.toFixed(6);
    // For very small values, use scientific notation
    return absValue.toExponential(2);
  };

  // Fix floating-point precision issues - use a more robust approach
  const normalizedTotalPnl = parseFloat(totalPnl.toFixed(10));

  // Format PnL - use normalized value for both color and sign
  const pnlColor =
    normalizedTotalPnl > 0
      ? "text-green-500"
      : normalizedTotalPnl < 0
      ? "text-red-500"
      : "text-gray-500";
  const pnlSign =
    normalizedTotalPnl > 0 ? "+" : normalizedTotalPnl < 0 ? "-" : "";

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 6
    )}`;
  };

  // Handle copy address to clipboard
  const handleCopyAddress = () => {
    if (displayAddress) {
      navigator.clipboard
        .writeText(displayAddress)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          // Copy action haptic feedback
          safeHaptic("copy");
          toast("Wallet address copied to clipboard");
        })
        .catch((err) => {
          // Error handling
        });
    }
  };

  // const handleDragEnd = (
  //   event: MouseEvent | TouchEvent | PointerEvent,
  //   info: PanInfo
  // ) => {
  //   const threshold = 100; // minimum distance to trigger navigation
  //   if (info.offset.x > threshold) {
  //     router.replace("/home");
  //   } else {
  //     controls.start({ x: 0 });
  //   }
  // };

  // Reset animation state when component mounts or updates
  useEffect(() => {
    controls.set({ x: 0 });
  }, [controls]);

  // If theme isn't loaded yet, render nothing to avoid flash
  if (!mounted) return null;

  return (
    <>
      <motion.div
        // {...(isMobile
        //   ? {
        //       drag: "x",
        //       dragConstraints: { left: 0, right: 0 },
        //       dragElastic: 0.2,
        //       onDragEnd: handleDragEnd,
        //       whileDrag: { cursor: "grabbing" },
        //     }
        //   : {})}
        animate={controls}
        initial={{ x: 0 }}
        className={`flex flex-col bg-transparent ${
          theme === "dark" ? "text-white" : "text-black"
        } p-4 xl:p-0`}
      >
        {/* Section 1: User Profile */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-[10px] lg:mt-0"
        >
          <div
            className={`${
              theme === "dark" ? "bg-[#1E1E1E]/80" : "bg-[#FFFFFF]/65 shadow-sm"
            } rounded-2xl p-5 mb-3 `}
          >
            {/* Total holding value */}
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col items-start">
                <span
                  className={`text-sm xl:text-lg tracking-widest font-medium ${
                    theme === "dark" ? "text-[#727272]" : "text-[#A1A1A1]"
                  }`}
                >
                  Total Position Value
                </span>
                <div className="my-2">
                  {isLoading && account?.address ? (
                    <div className="flex items-center space-x-2">
                      <Skeleton
                        className={`h-8 xl:h-12 w-32 xl:w-48 ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                        }`}
                      />
                      <Skeleton
                        className={`h-6 xl:h-8 w-16 ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                        }`}
                      />
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-3xl font-bold xl:font-medium xl:text-5xl ${
                          theme === "dark"
                            ? "text-white xl:text-[#FFCA59] xl:drop-shadow-[0_0_12px_rgba(255,202,89,0.5)]"
                            : "text-black"
                        }`}
                        style={{
                          fontFamily: "var(--font-tt-travels), sans-serif",
                        }}
                      >
                        ${totalHolding.toFixed(2)}
                      </span>
                      {/* pnl */}
                      <span
                        className={`text-sm xl:text-lg tracking-widest font-medium px-2 ${pnlColor}`}
                      >
                        {pnlSign}${formatPnl(normalizedTotalPnl)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start">
              {/* Wallet Address */}

              <div
                className={`text-sm ${
                  theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                } flex items-center`}
              >
                <span>
                  {account?.address && formatAddress(account.address)}
                </span>
                {!account?.address && (
                  <button
                    onClick={login}
                    className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      theme === "dark"
                        ? "bg-[#8266E6] hover:bg-[#7255d5] text-white"
                        : "bg-[#8266E6] hover:bg-[#7255d5] text-white"
                    }`}
                  >
                    Connect Wallet
                  </button>
                )}

                {account?.address && (
                  <button
                    onClick={handleCopyAddress}
                    className={`ml-2 p-1 rounded-full transition-colors ${
                      theme === "dark"
                        ? "hover:bg-gray-700/70"
                        : "hover:bg-gray-100"
                    }`}
                    aria-label="Copy address to clipboard"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`${
              theme === "dark" ? "bg-[#1E1E1E]/80" : "bg-[#FFFFFF]/65 shadow-sm"
            } rounded-2xl p-5 mb-3`}
          >
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full text-sm xl:text-lg mb-4">
                <span
                  className={`tracking-widest font-medium ${
                    theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                  }`}
                >
                  YOUR POSITIONS
                </span>

                <div
                  className={`flex items-center gap-1 ${
                    theme === "dark" ? "text-[#A1A1A1]" : "text-[#727272]"
                  } cursor-pointer hover:underline hover:opacity-80 transition-opacity`}
                  onClick={() => {
                    mediumHaptic();
                    setShowViewAllModal(true);
                  }}
                >
                  <span className="tracking-widest font-medium">View All</span>
                  <ArrowRight size={16} />
                </div>
              </div>
              {isLoading ? (
                <div className="w-full space-y-4">
                  {/* Skeleton for HoldingCard */}
                  {[...Array(1)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-full max-w-md mx-auto rounded-2xl overflow-hidden border ${
                        theme === "dark"
                          ? "bg-[#0B0424] border-white/30"
                          : "bg-[#F5F2FF] border-[#CECECE]"
                      } shadow-md relative`}
                      style={{
                        boxShadow:
                          theme === "dark"
                            ? "inset 0 0 20px rgba(143, 99, 233, 0.45)"
                            : "inset 0 0 20px rgba(143, 99, 233, 0.2)",
                      }}
                    >
                      <div className="p-4 flex flex-col relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <Skeleton
                              className={`w-10 h-10 rounded-full ${
                                theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                              }`}
                            />
                            <div>
                              <Skeleton
                                className={`h-5 w-16 mb-1 ${
                                  theme === "dark"
                                    ? "bg-gray-700"
                                    : "bg-gray-300"
                                }`}
                              />
                              <Skeleton
                                className={`h-3 w-20 ${
                                  theme === "dark"
                                    ? "bg-gray-700"
                                    : "bg-gray-300"
                                }`}
                              />
                            </div>
                          </div>
                          <Skeleton
                            className={`h-8 w-16 rounded-full ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <div className="text-center mb-4">
                          <Skeleton
                            className={`h-9 w-24 mx-auto ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                      <Skeleton
                        className={`w-full h-12 rounded-none ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              ) : filteredHoldings.length === 0 ? (
                <div
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No Positions Available
                </div>
              ) : (
                filteredHoldings.slice(0, 1).map((h, idx) => {
                  return (
                    <HoldingCard
                      key={idx}
                      symbol={h.pairName}
                      name={h.protocolName}
                      amount={h.initialAmount.toString()}
                      apy={h.apy.toString()}
                      protocolLogo={h.protocolLogo}
                      pnl={h.pnl}
                      currentAmount={h.currentAmount.toString()}
                      pool={{
                        name: h.protocolName,
                        apy: h.apy.toFixed(3),
                        risk: h.risk, // Default risk level
                        pair_or_vault_name: h.pairName,
                        protocol_id: h.protocolName
                          .toLowerCase()
                          .replace(/\s+/g, "-"),
                        protocol_pair_id: h.protocolPairId
                          .toLowerCase()
                          .replace(/\s+/g, "-"),
                      }}
                      balance={h.currentAmount.toString()}
                      address={displayAddress || undefined}
                      refreshBalance={() => {
                        // TODO: Refetch holdings data
                        if (account?.address) {
                          setIsLoading(true);
                          fetch(`/api/holdings?address=${account.address}`)
                            .then((res) => res.json())
                            .then((data) => {
                              setHoldings(Array.isArray(data) ? data : []);
                            })
                            .catch(() => {
                              setHoldings([]);
                            })
                            .finally(() => setIsLoading(false));
                        }
                      }}
                      onClick={() => {}}
                    />
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* View All Modal */}
        {showViewAllModal && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                mediumHaptic();
                setShowViewAllModal(false);
              }
            }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Modal Content */}
            <div className="relative z-[999] w-full max-w-4xl max-h-[90vh]">
              <Card
                title="All Positions"
                onClose={() => {
                  mediumHaptic();
                  setShowViewAllModal(false);
                }}
                className="max-h-[90vh] overflow-hidden"
              >
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-1 scrollbar-hide">
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4">
                      {[...Array(6)].map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-full rounded-2xl overflow-hidden border ${
                            theme === "dark"
                              ? "bg-[#0B0424] border-gray-700"
                              : "bg-[#F5F2FF] border-gray-200"
                          } shadow-md relative`}
                          style={{
                            boxShadow:
                              theme === "dark"
                                ? "inset 0 0 20px rgba(143, 99, 233, 0.45)"
                                : "inset 0 0 20px rgba(143, 99, 233, 0.2)",
                          }}
                        >
                          <div className="p-4 flex flex-col relative z-10">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                <Skeleton
                                  className={`w-10 h-10 rounded-full ${
                                    theme === "dark"
                                      ? "bg-gray-700"
                                      : "bg-gray-300"
                                  }`}
                                />
                                <div>
                                  <Skeleton
                                    className={`h-5 w-16 mb-1 ${
                                      theme === "dark"
                                        ? "bg-gray-700"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <Skeleton
                                    className={`h-3 w-20 ${
                                      theme === "dark"
                                        ? "bg-gray-700"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                </div>
                              </div>
                              <Skeleton
                                className={`h-8 w-16 rounded-full ${
                                  theme === "dark"
                                    ? "bg-gray-700"
                                    : "bg-gray-300"
                                }`}
                              />
                            </div>
                            <div className="text-center mb-4">
                              <Skeleton
                                className={`h-9 w-24 mx-auto ${
                                  theme === "dark"
                                    ? "bg-gray-700"
                                    : "bg-gray-300"
                                }`}
                              />
                            </div>
                          </div>
                          <Skeleton
                            className={`w-full h-12 rounded-none ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : filteredHoldings.length === 0 ? (
                    <div className="text-center py-12">
                      <div
                        className={`text-lg font-medium mb-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        No Positions Available
                      </div>
                      <div
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Start investing to see your positions here
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredHoldings.map((h, idx) => (
                        <HoldingCard
                          key={idx}
                          symbol={h.pairName}
                          name={h.protocolName}
                          amount={h.initialAmount.toString()}
                          apy={h.apy.toString()}
                          protocolLogo={h.protocolLogo}
                          pnl={h.pnl}
                          currentAmount={h.currentAmount.toString()}
                          pool={{
                            name: h.protocolName,
                            apy: h.apy.toFixed(3),
                            risk: h.risk,
                            pair_or_vault_name: h.pairName,
                            protocol_id: h.protocolName
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                            protocol_pair_id: h.protocolPairId
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                          }}
                          balance={h.currentAmount.toString()}
                          address={displayAddress || undefined}
                          refreshBalance={() => {
                            // TODO: Refetch holdings data
                            if (account?.address) {
                              setIsLoading(true);
                              fetch(`/api/holdings?address=${account.address}`)
                                .then((res) => res.json())
                                .then((data) => {
                                  setHoldings(Array.isArray(data) ? data : []);
                                })
                                .catch(() => {
                                  setHoldings([]);
                                })
                                .finally(() => setIsLoading(false));
                            }
                          }}
                          onClick={() => {
                            mediumHaptic();
                            setShowViewAllModal(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div
                  className={`mt-6 pt-4 border-t ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Positions: {filteredHoldings.length}
                    </div>
                    <button
                      onClick={() => {
                        mediumHaptic();
                        setShowViewAllModal(false);
                      }}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        theme === "dark"
                          ? "bg-[#8266E6] hover:bg-[#3C229C] text-white"
                          : "bg-[#8266E6] hover:bg-[#3C229C] text-white"
                      }`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
