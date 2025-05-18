"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { RadialProgressBar } from "@/components/circular-progress-bar/Radial-Progress-Bar"
import '@/components/circular-progress-bar/styles.css'

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
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const maxBalance = 1000 // Example max balance, would come from user's wallet in real app

  // Handle modal close and reset values
  const handleClose = () => {
    setAmount("0")
    setSliderValue(0)
    onClose()
  }

  // Set mounted state once hydration is complete and handle touch events
  useEffect(() => {
    setMounted(true)
    
    // Prevent background scrolling when modal is open
    if (pool) {
      document.body.style.overflow = 'hidden'
      
      // Add touch event listeners with passive: false
      const preventTouch = (e: TouchEvent) => {
        e.preventDefault()
      }
      
      document.addEventListener('touchmove', preventTouch, { passive: false })
      
      // Clean up
      return () => {
        document.body.style.overflow = 'auto'
        document.removeEventListener('touchmove', preventTouch)
      }
    }
  }, [pool])

  // Update slider when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
    const numValue = Number.parseFloat(value) || 0
    // Ensure we don't exceed maxBalance
    const limitedValue = Math.min(numValue, maxBalance)
    setSliderValue((limitedValue / maxBalance) * 100)
  }

  // Calculate estimated yearly yield
  const yearlyYield = (Number.parseFloat(amount) * (pool?.apy || 0)) / 100

  // Handle deposit confirmation
  const handleConfirmDeposit = () => {
    setIsSubmitting(true)

    // Log the deposit details
    console.log({
      action: 'Deposit Confirmation',
      depositAmount: `$${amount}`,
      poolName: pool?.name,
      estimatedYearlyYield: `$${yearlyYield.toFixed(2)}`,
      apy: `${pool?.apy}%`,
      pair: `${pool?.name}`
    })

    // Simulate API call with timeout
    setTimeout(() => {
      setIsSubmitting(false)

      // Show success toast
      toast({
        variant: "success",
        title: "Deposit Successful",
        description: `$${amount} deposited into ${pool?.name}`,
      })

      // Close modal and reset values
      handleClose()

      // Trigger haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]) // Vibrate pattern: 100ms on, 50ms off, 100ms on
      }
    }, 1000)
  }

  // Handle radial progress update
  const handleRadialProgressUpdate = (progressPercentage: number) => {
    setSliderValue(progressPercentage)
    const calculatedAmount = ((progressPercentage / 100) * maxBalance).toFixed(2)
    setAmount(calculatedAmount)
  }

  // Watch for changes in the sliderValue
  useEffect(() => {
    // This effect is intentionally empty as we're just syncing the values in the UI
  }, [sliderValue])

  // If theme isn't loaded yet or no pool selected, return nothing
  if (!mounted || !pool) return null

  // Calculate the initial angle for the radial progress bar (0-1 range)
  const initialAngle = sliderValue / 100;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" 
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} 
          rounded-lg w-full max-w-md p-4 max-h-[90vh] overflow-y-auto overscroll-contain touch-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold mb-6">Deposit to {pool.name}</h3>
        
        <div className="flex flex-col space-y-6">
          {/* Input and Circle Section */}
          <div>
            {/* Radial progress bar */}
            <div className="flex flex-col items-center touch-none">
              <RadialProgressBar 
                initialAngle={initialAngle} 
                maxBalance={maxBalance}
                onAngleChange={handleRadialProgressUpdate}
              />
            </div>

            <div className={`text-right text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1 w-full`}>
              Balance: {maxBalance.toFixed(2)} USDC
            </div>
          </div>

          {/* Statistics */}
          <div className={`${theme === 'dark' ? 'bg-[#0f0b22]/30' : 'bg-gray-100/50'} rounded-lg p-4`}>
            <div className="flex justify-between text-sm mb-2">
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Estimated APY</span>
              <span className="text-green-400">{pool.apy}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Estimated Yearly Yield</span>
              <span className={theme === 'dark' ? 'text-white' : 'text-black'}>${yearlyYield.toFixed(2)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-black font-semibold py-3 rounded-lg"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className={`flex-1 font-semibold py-3 rounded-lg relative ${
                isSubmitting 
                  ? "bg-gray-300 text-gray-500" 
                  : "bg-green-400 text-black"
              }`}
              disabled={Number.parseFloat(amount) <= 0 || isSubmitting}
              onClick={handleConfirmDeposit}
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">Confirm Deposit</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                "Confirm Deposit"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}