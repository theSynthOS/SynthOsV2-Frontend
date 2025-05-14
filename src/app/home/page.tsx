"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import DynamicFeatures from "@/components/home/dynamic-features"
import { useTheme } from "next-themes"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { theme } = useTheme()
  
  // Redirect to root if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, router])

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-[#0f0b22]' : 'bg-white'}`}>
        <div className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Loading...</div>
      </div>
    )
  }
  
  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-[#0f0b22] text-white' : 'bg-white text-black'}`}>
      <div className="flex flex-col min-h-screen">
        {/* Balance */}
        <div className={`px-4 py-6 pt-[80px] border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total balance</div>
          <div className="flex items-center">
            <div className="text-4xl font-bold">$0.00</div>
            <div className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>▶</div>
          </div>
        </div>

        {/* Dynamic Features */}
        <DynamicFeatures />
      </div>
    </div>
  )
}
