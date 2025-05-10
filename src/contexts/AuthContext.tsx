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