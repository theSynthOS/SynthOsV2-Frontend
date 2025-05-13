"use client"

import { Home, Award, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const router = useRouter()
  
  return (
    <div className="border-t border-gray-800 bg-[#0f0b22]">
      <div className="flex justify-around py-4">
        <button onClick={() => router.push('/')} className="flex flex-col items-center">
          <Home className="h-6 w-6" />
          <span className="text-sm mt-1">Home</span>
        </button>
        <button onClick={() => router.push('/rewards')} className="flex flex-col items-center text-gray-500">
          <Award className="h-6 w-6" />
          <span className="text-sm mt-1">Feeds</span>
        </button>
        <button onClick={() => router.push('/holding')} className="flex flex-col items-center text-gray-500">
          <Wallet className="h-6 w-6" />
          <span className="text-sm mt-1">Holdings</span>
        </button>
      </div>
    </div>
  )
}
