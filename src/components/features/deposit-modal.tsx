"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { RadialProgressBar } from "@/components/circular-progress-bar/Radial-Progress-Bar"

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
  const [maxBalance, setMaxBalance] = useState(1000)
  const { toast } = useToast()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Keep track of the previous maxBalance value to handle transitions
  const prevMaxBalanceRef = useRef(maxBalance)

  // For demo purposes - simulate balance changes
  // useEffect(() => {
  //   // Uncomment this to test balance changes
  //    const timer = setTimeout(() => {
  //      setMaxBalance(prev => prev === 1000 ? 2000 : 1000);
  //    }, 5000);
  //    return () => clearTimeout(timer);
  // }, [maxBalance]);

  // Handle maxBalance updates while maintaining the percentage
  useEffect(() => {
    if (pool) {
      if (prevMaxBalanceRef.current !== maxBalance) {
        // Store the previous maxBalance
        prevMaxBalanceRef.current = maxBalance
        
        // The slider value (percentage) should remain the same
        // Only the absolute amount needs to be recalculated
        const currentPercentage = sliderValue
        const newAmount = ((currentPercentage / 100) * maxBalance).toFixed(2)
        setAmount(newAmount)
      }
    }
  }, [maxBalance, pool, sliderValue])

  // Handle modal close and reset values
  const handleClose = () => {
    setAmount("0")
    setSliderValue(0)
    onClose()
  }

  // Set mounted state and handle scroll lock
  useEffect(() => {
    setMounted(true)
    
    if (pool) {
      // Save current body styles and position
      const scrollY = window.scrollY
      const originalStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        height: document.body.style.height
      }
      
      // Prevent background scrolling and interactions
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      
      return () => {
        // Restore original body styles
        document.body.style.overflow = originalStyle.overflow
        document.body.style.position = originalStyle.position
        document.body.style.top = originalStyle.top
        document.body.style.width = originalStyle.width
        document.body.style.height = originalStyle.height
        
        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [pool])

  // Prevent touchmove events from propagating to body
  useEffect(() => {
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      
      // Check if we're inside the modal content
      if (modalRef.current && modalRef.current.contains(target)) {
        // Allow scrolling within scrollable elements inside the modal
        const isScrollable = (el: HTMLElement) => {
          // Check if the element has a scrollbar
          const hasScrollableContent = el.scrollHeight > el.clientHeight
          // Get the computed overflow-y style
          const overflowYStyle = window.getComputedStyle(el).overflowY
          // Check if overflow is set to something scrollable
          const isOverflowScrollable = ['scroll', 'auto'].includes(overflowYStyle)
          
          return hasScrollableContent && isOverflowScrollable
        }
        
        // Find if we're inside a scrollable container
        let scrollableParent = target
        while (scrollableParent && modalRef.current.contains(scrollableParent)) {
          if (isScrollable(scrollableParent)) {
            // If we're at the top or bottom edge of the scrollable container, prevent default behavior
            const atTop = scrollableParent.scrollTop <= 0
            const atBottom = scrollableParent.scrollHeight - scrollableParent.scrollTop <= scrollableParent.clientHeight + 1
            
            // Check scroll direction using touch position
            if (e.touches.length > 0) {
              const touch = e.touches[0]
              const touchY = touch.clientY
              
              // Store the last touch position
              const lastTouchY = scrollableParent.getAttribute('data-last-touch-y')
              scrollableParent.setAttribute('data-last-touch-y', touchY.toString())
              
              if (lastTouchY) {
                const touchDelta = touchY - parseFloat(lastTouchY)
                const scrollingUp = touchDelta > 0
                const scrollingDown = touchDelta < 0
                
                // Only prevent default if trying to scroll past the edges
                if ((atTop && scrollingUp) || (atBottom && scrollingDown)) {
                  e.preventDefault()
                }
                
                // Allow scrolling within the container
                return
              }
            }
            return
          }
          scrollableParent = scrollableParent.parentElement as HTMLElement
        }
        
        // If we're not in a scrollable container within the modal, prevent default
        e.preventDefault()
      }
    }
    
    // Add the touchmove listener
    document.addEventListener('touchmove', preventTouchMove, { passive: false })
    
    return () => {
      // Remove the touchmove listener
      document.removeEventListener('touchmove', preventTouchMove)
    }
  }, [])

  // Handle radial progress update
  const handleRadialProgressUpdate = (progressPercentage: number) => {
    setSliderValue(progressPercentage)
    const calculatedAmount = ((progressPercentage / 100) * maxBalance).toFixed(2)
    setAmount(calculatedAmount)
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

  // If theme isn't loaded yet or no pool selected, return nothing
  if (!mounted || !pool) return null

  // Calculate the initial angle for the radial progress bar (0-1 range)
  const initialAngle = sliderValue / 100;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-hidden" 
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        ref={modalRef}
        className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} 
          rounded-lg w-full max-w-md p-4 overflow-hidden max-h-[90vh] relative isolate`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold mb-4">Deposit to {pool.name}</h3>
        
        <div className="flex flex-col space-y-5 overflow-y-auto max-h-[calc(90vh-8rem)] pb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Input and Circle Section */}
          <div>
            {/* Radial progress bar */}
            <div className="flex flex-col items-center">
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
        </div>

        {/* Buttons - Fixed at the bottom */}
        <div className="mt-4 flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
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
  )
}