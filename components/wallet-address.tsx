"use client"

import { useState, useEffect } from "react"
import { isLoggedIn } from "../app/actions/login"

export default function WalletAddress() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loggedIn = await isLoggedIn()
        if (loggedIn) {
          const storedAddress = localStorage.getItem('walletAddress')
          if (storedAddress) {
            setWalletAddress(storedAddress)
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkLoginStatus()
  }, [])

  if (isLoading || !walletAddress) return null

  return (
    <div className="px-4 py-2">
      <div className="text-sm text-gray-400">Wallet Address</div>
      <div className="font-mono text-sm break-all">{walletAddress}</div>
    </div>
  )
} 