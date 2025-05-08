"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface PositionProps {
  protocolName: string
  positions?: PoolPosition[]
}

interface PoolPosition {
  poolName: string
  value: string
  quantity: string
  apy: number
}

export default function UserPosition({ protocolName, positions = [] }: PositionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasPositions = positions.length > 0

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Your position</h3>
        {hasPositions && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>

      <div className="flex justify-between mb-2">
        <div className="text-gray-400">Value</div>
        <div className="font-semibold">
          {hasPositions
            ? positions.reduce((sum, pos) => sum + Number.parseFloat(pos.value.replace("$", "")), 0).toFixed(2)
            : "$0.00"}
        </div>
      </div>

      <div className="flex justify-between mb-2">
        <div className="text-gray-400">Quantity</div>
        <div className="font-semibold">{hasPositions ? positions.length : 0}</div>
      </div>

      {!hasPositions && (
        <div className="text-gray-400 text-sm mt-2">
          You don't have any active positions in {protocolName} pools or vaults.
        </div>
      )}

      {hasPositions && isExpanded && (
        <div className="mt-4 space-y-3 border-t border-gray-700 pt-3">
          {positions.map((position, index) => (
            <div key={index} className="bg-gray-700/50 rounded p-2">
              <div className="flex justify-between text-sm">
                <span>{position.poolName}</span>
                <span className="text-green-400">{position.apy}% APY</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Value:</span>
                <span>{position.value}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount:</span>
                <span>{position.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
