"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import CustomConnectWallet from "@/components/CustomConnectWallet"
import Image from "next/image"
import { useTheme } from "next-themes"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, address } = useAuth()
  const { theme } = useTheme()
  
  // Log authentication state changes
  useEffect(() => {
    console.log("Landing page auth state:", { isAuthenticated, address })
    
    // Redirect to home if authenticated
    if (isAuthenticated) {
      router.push("/home")
    }
  }, [isAuthenticated, address, router])
  
  
  return (
    <div className={`flex flex-col items-center justify-center h-screen p-4 ${theme === 'dark' ? 'bg-[#0f0b22]' : 'bg-white'}`}>
      <Image src="/SynthOS-transparent.png" alt="SynthOS Logo" width={96} height={96} />
      <div className={`text-4xl font-bold  mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        SynthOS
      </div>

      <div className={`text-xl font-bold mb-8 flex text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        Compare APY across all defi platforms so you invest smarter
      </div>

      {/* Custom Connect Wallet Component */}
      <CustomConnectWallet />
    </div>
  )
}
