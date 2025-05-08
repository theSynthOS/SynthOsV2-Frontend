"use client"
import { Info, Check } from "lucide-react"

interface PoolsProps {
  pools: Pool[]
  onSelectPool: (pool: Pool | null) => void
  selectedPoolId: number | null
}

interface Pool {
  id: number
  name: string
  apy: number
  tvl: string
  risk: string
}

export default function AvailablePools({ pools, onSelectPool, selectedPoolId }: PoolsProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Available Pools</h2>
      <div className="space-y-3">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className={`bg-gray-800/50 rounded-lg p-3 ${selectedPoolId === pool.id ? "border border-green-400" : ""}`}
            onClick={() => onSelectPool(pool)}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">{pool.name}</div>
              <div className="text-green-400 font-bold">{pool.apy}% APY</div>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <div>TVL: {pool.tvl}</div>
              <div className="flex items-center">
                Risk: {pool.risk}
                <Info size={14} className="ml-1 text-gray-500" />
              </div>
            </div>
            {selectedPoolId === pool.id && (
              <div className="flex justify-end mt-2">
                <div className="bg-green-400/20 text-green-400 rounded-full p-1">
                  <Check size={16} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
