"use client"

import type React from "react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"

interface DepositModalProps {
  pool: {
    name: string
    apy: number
    risk: string
  } | null
  onClose: () => void
}

export default function DepositModal({ pool, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState<string>("0")
  const [sliderValue, setSliderValue] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const maxBalance = 1000 // Example max balance, would come from user's wallet in real app

  // Update input when slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    setSliderValue(value)
    setAmount(((value / 100) * maxBalance).toFixed(2))
  }

  // Update slider when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
    const numValue = Number.parseFloat(value) || 0
    setSliderValue((numValue / maxBalance) * 100)
  }

  // Calculate estimated yearly yield
  const yearlyYield = (Number.parseFloat(amount) * (pool?.apy || 0)) / 100

  // Handle deposit confirmation
  const handleConfirmDeposit = () => {
    setIsSubmitting(true)

    // Simulate API call with timeout
    setTimeout(() => {
      setIsSubmitting(false)

      // Show success toast
      toast({
        variant: "success",
        title: (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Deposit Successful
          </div>
        ),
        description: `$${amount} deposited into ${pool?.name}`,
      })

      // Close modal
      onClose()

      // Trigger haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]) // Vibrate pattern: 100ms on, 50ms off, 100ms on
      }
    }, 1000)
  }

  if (!pool) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0f0b22] rounded-lg w-full max-w-md p-4">
        <h3 className="text-2xl font-bold mb-6">Deposit to {pool.name}</h3>
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Current APY</span>
            <span className="text-green-400">{pool.apy}%</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span>Risk Level</span>
            <span>{pool.risk}</span>
          </div>

          <div className="mb-6">
            <label className="block text-sm mb-2">Amount to Deposit</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full bg-gray-800 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-green-400 border border-green-400/30"
                disabled={isSubmitting}
              />
              <div className="absolute right-3 top-3 text-gray-400">USDC</div>
            </div>

            {/* Slider */}
            <div className="mt-4 px-1">
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-400"
                disabled={isSubmitting}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="text-right text-xs text-gray-400 mt-2">Balance: {maxBalance.toFixed(2)} USDC</div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Estimated APY</span>
              <span className="text-green-400">{pool.apy}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimated Yearly Yield</span>
              <span>${yearlyYield.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 text-white font-semibold py-3 rounded-lg"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={`flex-1 font-semibold py-3 rounded-lg relative ${
              isSubmitting ? "bg-gray-600 text-gray-400" : "bg-green-400 text-black"
            }`}
            disabled={Number.parseFloat(amount) <= 0 || isSubmitting}
            onClick={handleConfirmDeposit}
          >
            {isSubmitting ? (
              <>
                <span className="opacity-0">Confirm Deposit</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              "Confirm Deposit"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
