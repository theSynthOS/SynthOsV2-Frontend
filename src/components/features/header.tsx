"use client"

import { Home, Award, Wallet, Settings, Search, History } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Header() {
    const router = useRouter()
  return (
    <div className="flex justify-between items-center p-4 bg-[#0f0b22] border-b border-gray-700/0 hover:border-gray-700">
        <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          <History className="h-4 w-4 text-gray-400" />
        </button>
        <div className="relative flex-1 mx-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search protocols"
            className="w-full bg-gray-800/50 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none"
          />
        </div>
        
        <button 
          className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
          onClick={() => router.push("/setting")}
        >
          <Settings className="h-4 w-4 text-gray-400" />
        </button>
      </div>
  )
}
