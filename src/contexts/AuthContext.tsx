"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createWallet } from "thirdweb/wallets"
import { client } from "@/client"
import { useRouter } from "next/navigation"

type AuthData = {
  address: string
  walletId?: string
  walletType?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  address: string | null
  login: (address: string, walletId?: string, walletType?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authData, setAuthData] = useState<AuthData | null>(null)

  // Get address from auth data
  const address = authData?.address || null

  // Function to store auth data in localStorage
  const login = (address: string, walletId?: string, walletType?: string) => {
    const data: AuthData = { address, walletId, walletType }
    
    // Store in state
    setAuthData(data)
    setIsAuthenticated(true)
    
    // Store in localStorage
    localStorage.setItem("user_auth", JSON.stringify(data))
    
    // Store passkey info if applicable
    if (walletType === "passkey") {
      localStorage.setItem("hasPasskey", "true")
    }
    
    console.log("Logged in with address:", address)
  }

  // Function to clear auth data
  const logout = () => {
    setAuthData(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user_auth")
    router.push("/")
    console.log("Logged out")
  }

  // Auto-login on component mount if we have stored auth data
  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Get stored auth data
        const storedAuth = localStorage.getItem("user_auth")
        if (!storedAuth) return
        
        const authData: AuthData = JSON.parse(storedAuth)
        
        // Attempt to reconnect based on stored data
        if (authData.walletId) {
          try {
            // Try to reconnect with the wallet
            const wallet = createWallet(authData.walletId as any)
            const account = await wallet.connect({
              client
            })
            
            if (account) {
              setAuthData(authData)
              setIsAuthenticated(true)
              // Redirect to home if we're on the login page
              if (window.location.pathname === "/") {
                router.push("/home")
              }
              console.log("Auto-reconnected to wallet:", authData.walletId)
            }
          } catch (e) {
            console.log("Could not auto-reconnect wallet, using address only", e)
            // Fall back to just using the address
            setAuthData(authData)
            setIsAuthenticated(true)
            // Redirect to home if we're on the login page
            if (window.location.pathname === "/") {
              router.push("/home")
            }
          }
        } else if (authData.address) {
          // Just use the stored address
          setAuthData(authData)
          setIsAuthenticated(true)
          // Redirect to home if we're on the login page
          if (window.location.pathname === "/") {
            router.push("/home")
          }
          console.log("Using stored address:", authData.address)
        }
      } catch (error) {
        console.error("Auto-login failed:", error)
        logout() // Clear invalid auth data
      }
    }

    autoLogin()
  }, [router])

  return (
    <AuthContext.Provider value={{ isAuthenticated, address, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 