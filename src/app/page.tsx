"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import CustomConnectWallet from "@/components/CustomConnectWallet"
import Image from "next/image"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, address } = useAuth()
  
  // Log authentication state changes
  useEffect(() => {
    console.log("Landing page auth state:", { isAuthenticated, address })
    
    // Redirect to home if authenticated
    if (isAuthenticated) {
      router.push("/home")
    }
  }, [isAuthenticated, address, router])
  
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0f0b22] p-4">
      <Image src="/SynthOS-tranparent.png" alt="SynthOS Logo" width={96} height={96} />
      <div className="text-4xl font-bold text-white mb-2">
        SynthOS
      </div>

      <div className="text-2xl font-bold text-white mb-8 flex text-center">
        Your gateway to the future of DeFi
      </div>

      {/* Custom Connect Wallet Component */}
      <CustomConnectWallet />
    </div>
  )
}
