"use client"

import { TrendingUp } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState } from "react"
import ProtocolOverlay from "./protocol-overlay"

export default function TopYielders() {
  const { theme } = useTheme()
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)
  
  const topYielders = [
    { id: "quill", name: "Quill Finance", apy: 12.19, logo: "/quill-finance-logo.png" },
    { id: "fx", name: "FX Protocol", apy: 9.86, logo: "/fx-protocol-logo.png" },
  ]

  return (
    <>
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <TrendingUp className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Top Yielders</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {topYielders.map((protocol) => (
            <div 
              key={protocol.id} 
              className="flex-shrink-0 w-1/2 cursor-pointer"
              onClick={() => setSelectedProtocol(protocol.id)}
            >
              <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-xl p-3 flex items-center`}>
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image src={protocol.logo || "/placeholder.svg"} alt={protocol.name} width={40} height={40} />
                </div>
                <div className="flex-1">
                  <div className={`text-lg font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{protocol.name}</div>
                  <div className="text-green-400 flex items-center text-sm">▲{protocol.apy.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProtocolOverlay 
        protocolId={selectedProtocol || ""}
        isOpen={!!selectedProtocol}
        onClose={() => setSelectedProtocol(null)}
      />
    </>
  )
}
