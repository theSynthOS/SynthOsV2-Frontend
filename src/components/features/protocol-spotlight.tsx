"use client"

import { Flame } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export default function ProtocolSpotlight() {
  const router = useRouter()
  const { theme } = useTheme()
  
  const handleProtocolClick = () => {
    router.push("/protocol/aave")
  }
  
  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-6">
        <Flame className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Spotlight</h2>
      </div>
      <div 
        className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'} rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity`} 
        onClick={handleProtocolClick}
      >
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
            <Image src="/aave-logo.png" alt="AAVE" width={48} height={48} />
          </div>
          <div>
            <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>AAVE</div>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>AAVE Protocol</div>
          </div>
          <div className="ml-auto flex items-center">
            <span className="bg-purple-500 text-xs px-2 py-1 rounded-full">Live</span>
          </div>
        </div>
        <div className="mt-2 flex items-center">
          <span className="text-green-400 flex items-center">▲8.45%</span>
          <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ml-2`}>Past day</span>
        </div>
      </div>
    </div>
  )
}
