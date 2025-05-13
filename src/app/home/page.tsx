"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import DynamicFeatures from "@/components/home/dynamic-features"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  // Redirect to root if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, router])

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0b22]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0b22] text-white">
      {/* Balance */}
      <div className="px-4 py-6 pt-[68px]">
        <div className="text-gray-400 text-sm">Total balance</div>
        <div className="flex items-center">
          <div className="text-4xl font-bold">$0.00</div>
          <div className="ml-2 text-gray-400">▶</div>
        </div>
      </div>

      {/* Dynamic Features */}
      <DynamicFeatures />
    </div>
  )
}
