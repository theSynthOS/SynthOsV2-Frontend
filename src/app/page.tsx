"use client"
import { scrollSepolia } from "@/client"
import { client } from "@/client"
import { ConnectButton } from "thirdweb/react"
import { wallets } from "./WalletProvider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import CustomConnectWallet from "@/components/CustomConnectWallet"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, address } = useAuth()
  
  // Log authentication state changes
  useEffect(() => {
    console.log("Home page auth state:", { isAuthenticated, address })
  }, [isAuthenticated, address])
  
  // Redirect to home if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Redirecting to home with address:", address)
      router.push("/home")
    }
  }, [isAuthenticated, router, address])
  
  // If authenticated, return null to prevent flash of content
  if (isAuthenticated) {
    return null
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0f0b22] p-4">
      <div className="text-4xl font-bold text-white mb-2">
        SynthOS
      </div>

      <div className="text-2xl font-bold text-white mb-8">
        Your gateway to the future of DeFi
      </div>

      {/* Custom Connect Wallet Component */}
      <CustomConnectWallet />
    </div>
  )
}
