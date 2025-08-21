"use client";

import { Home, Award, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { mediumHaptic } from "@/lib/haptic-utils";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();
  const { user, authenticated } = usePrivy();
  const { displayAddress, smartWalletClient, isSmartWalletActive } = useSmartWallet();

  // Use display address from context
  const account = authenticated && displayAddress ? { address: displayAddress } : null;

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handlePointsClick = () => {
    mediumHaptic();
    router.push("/points");
  };

  return (
    <div
      className={`relative border-t xl:hidden z-[999] ${
        theme === "dark"
          ? "border-gray-800 bg-[#0f0b22]"
          : "border-gray-200 bg-[#f0eef9]"
      } transition-all duration-200 ${
        isScrolled ? "shadow-lg" : ""
      } rounded-t-[2rem]`}
    >
      <div className="flex justify-between items-end pt-5 pb-8 max-w-md mx-auto px-16 relative">
        {/* Home */}
        <Link
          href="/home"
          className={`flex flex-col items-center ${
            isActive("/home")
              ? "text-[#8266E6"
              : theme === "dark"
              ? "text-gray-500"
              : "text-gray-400"
          }`}
        >
          <Home
            className={`h-6 w-6 ${isActive("/home") ? "text-[#8266E6]" : ""}`}
          />
          <span
            className={`text-xs mt-1 font-semibold ${
              isActive("/home")
                ? "text-[#8266E6]"
                : theme === "dark"
                ? "text-gray-500"
                : "text-gray-400"
            }`}
          >
            Home
          </span>
        </Link>

        {/* Points */}
        <button
          onClick={handlePointsClick}
          className="absolute left-1/2 -translate-x-1/2 -top-8 flex flex-col items-center z-20 group"
        >
          <div
            className={`rounded-full border-2 border-[#8266E6] shadow-lg shadow-[#8266E6]/50 flex flex-col items-center justify-center w-24 h-24 p-2 transition-all duration-200 group-hover:border-purple-500 group-hover:shadow-purple-500/50 ${
              theme === "dark" ? "bg-gray-800" : "bg-purple-100"
            }`}
          >
            <Award className="h-8 w-8 text-[#8266E6] group-hover:text-purple-500 transition-colors" />
            <span
              className={`text-lg font-bold mt-2 transition-colors ${
                theme === "dark" ? "text-purple-300" : "text-[#573faf]"
              } group-hover:text-purple-500`}
            >
              0
            </span>
            <span className="text-sm font-semibold text-[#8266E6] group-hover:text-purple-500 transition-colors">
              Pts
            </span>
          </div>
        </button>

        {/* Holdings */}
        <Link
          href="/holding"
          className={`flex flex-col items-center ${
            isActive("/holding")
              ? "text-[#8266E6]"
              : theme === "dark"
              ? "text-gray-500"
              : "text-gray-400"
          }`}
        >
          <Wallet
            className={`h-6 w-6 ${
              isActive("/holding") ? "text-[#8266E6]" : ""
            }`}
          />
          <span
            className={`text-xs mt-1 font-semibold ${
              isActive("/holding")
                ? "text-[#8266E6]"
                : theme === "dark"
                ? "text-gray-500"
                : "text-gray-400"
            }`}
          >
            Positions
          </span>
        </Link>
      </div>
    </div>
  );
}
