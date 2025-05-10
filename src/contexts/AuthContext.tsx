"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react"
import type { Account } from "thirdweb/wallets"

interface AuthContextType {
  isAuthenticated: boolean
  account: Account | null
  address: string | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  account: null,
  address: null,
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const account = useActiveAccount()
  const wallet = useActiveWallet()
  const { disconnect } = useDisconnect()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Initial hydration check
  useEffect(() => {
    // This effect runs only once on component mount
    // and will be replaced by the account change effect below
    // once account data is available
    
    // We'll set a short timeout to give Thirdweb time to restore session
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  // Handle account changes
  useEffect(() => {
    const updateAuth = () => {
      // Log the raw account data
      console.log("Raw account data:", {
        hasAccount: Boolean(account),
        accountAddress: account?.address,
        hasWallet: Boolean(wallet)
      })

      if (account && account.address) {
        console.log("Setting authenticated with address:", account.address)
        setIsAuthenticated(true)
        setAddress(account.address)
        setIsInitializing(false) // No longer initializing once we have account
      } else {
        console.log("No valid account found, setting unauthenticated")
        setIsAuthenticated(false)
        setAddress(null)
      }
    }

    // Call immediately when account or wallet changes
    updateAuth()
    
    // No interval needed - React will re-run this effect when dependencies change
  }, [account, wallet])

  // Return loading state during initialization
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0b22]">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  const logout = async () => {
    try {
      if (wallet) {
        await disconnect(wallet)
      }
      setIsAuthenticated(false)
      setAddress(null)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      account: account || null, 
      address,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 