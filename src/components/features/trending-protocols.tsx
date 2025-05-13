"use client"

import { Flame } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function TrendingProtocols() {
  const router = useRouter()
  
  const trendingProtocols = [
    { id: "aave", name: "AAVE", apy: 6.13, tvl: "$1.1B", logo: "/aave-logo.png", isUp: true, change: 1.27 },
    { id: "fx", name: "FX Protocol", apy: 9.86, tvl: "$463M", logo: "/fx-protocol-logo.png", isUp: true, change: 2.32 },
    { id: "quill", name: "Quill Finance", apy: 12.19, tvl: "$262M", logo: "/quill-finance-logo.png", isUp: true, change: 3.15 },
  ]

  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-6">
        <Flame className="w-5 h-5 mr-2 text-white" />
        <h2 className="text-2xl font-bold">Trending</h2>
      </div>
      <div className="space-y-6">
        {trendingProtocols.map((protocol) => (
          <div 
            key={protocol.id}
            className="flex items-center cursor-pointer"
            onClick={() => router.push(`/protocol/${protocol.id}`)}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
              <Image src={protocol.logo || "/placeholder.svg"} alt={protocol.name} width={40} height={40} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{protocol.name}</div>
              <div className="text-sm text-gray-400">{protocol.tvl} TVL</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{protocol.apy.toFixed(2)}%</div>
              <div
                className={`text-[12px] ${protocol.isUp ? "text-green-400" : "text-red-400"} flex items-center justify-end`}
              >
                {protocol.isUp ? "▲" : "▼"}{protocol.change.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
