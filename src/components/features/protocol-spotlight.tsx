"use client"

import { Flame } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function ProtocolSpotlight() {
  const router = useRouter()
  
  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-2">
        <Flame className="w-5 h-5 mr-2 text-white" />
        <h2 className="text-xl font-bold">Spotlight</h2>
      </div>
      <div 
        className="bg-gray-800/50 rounded-xl p-4 cursor-pointer" 
        onClick={() => router.push("/protocol/aave")}
      >
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
            <Image src="/aave-logo.png" alt="AAVE" width={48} height={48} />
          </div>
          <div>
            <div className="text-gray-400">AAVE</div>
            <div className="text-2xl font-bold">AAVE Protocol</div>
          </div>
          <div className="ml-auto flex items-center">
            <span className="bg-purple-500 text-xs px-2 py-1 rounded-full">Live</span>
          </div>
        </div>
        <div className="mt-2 flex items-center">
          <span className="text-green-400 flex items-center">▲ 8.45%</span>
          <span className="text-gray-400 ml-2">Past day</span>
        </div>
      </div>
    </div>
  )
}
