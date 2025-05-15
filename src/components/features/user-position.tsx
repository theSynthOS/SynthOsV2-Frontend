"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface PositionProps {
  protocolName: string
  positions?: PoolPosition[]
  theme?: string
}

interface PoolPosition {
  poolName: string
  value: string
  quantity: string
  apy: number
}

export default function UserPosition({ protocolName, positions = [], theme }: PositionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasPositions = positions.length > 0

  return (
    <div className={` rounded-lg p-4`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Your position</h3>
        {hasPositions && (
          <button onClick={() => setIsExpanded(!isExpanded)} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>

      <div className="flex justify-between mb-2">
        <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-semibold`}>Value</div>
        <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          {hasPositions
            ? positions.reduce((sum, pos) => sum + Number.parseFloat(pos.value.replace("$", "")), 0).toFixed(2)
            : "$0.00"}
        </div>
      </div>

      <div className="flex justify-between mb-2">
        <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-semibold`}>Quantity</div>
        <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{hasPositions ? positions.length : 0}</div>
      </div>
      {!hasPositions && (
        <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          No Positions
        </div>
      )}

      {hasPositions && isExpanded && (
        <div className="mt-4 space-y-3 border-t border-gray-700 pt-3">
          {positions.map((position, index) => (
            <div key={index} className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200/50'} rounded p-2`}>
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-white' : 'text-black'}>{position.poolName}</span>
                <span className="text-green-400">{position.apy}% APY</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Value:</span>
                <span className={theme === 'dark' ? 'text-white' : 'text-black'}>{position.value}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Amount:</span>
                <span className={theme === 'dark' ? 'text-white' : 'text-black'}>{position.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
