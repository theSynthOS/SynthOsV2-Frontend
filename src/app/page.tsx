"use client"
import { scrollSepolia } from "@/client"
import { client } from "@/client"
import { ConnectButton } from "thirdweb/react"
import { wallets } from "./WalletProvider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

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
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-4xl font-bold">
        SynthOS
      </div>

      <div className="text-2xl font-bold">
        Your gateway to the future of DeFi
      </div>

      <div className="w-20">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          accountAbstraction={{
            chain: scrollSepolia,
            sponsorGas: true,
          }}
        />
      </div>
    </div>
  )
}
