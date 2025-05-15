"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createWallet } from "thirdweb/wallets"
import { client } from "@/client"
import { useRouter } from "next/navigation"

// Session storage keys
const AUTH_STORAGE_KEY = "user_auth"
const SESSION_KEY = "session_active"
const PASSKEY_STORAGE_KEY = "hasPasskey"

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const router = useRouter()

  // Get address from auth data
  const address = authData?.address || null

  // Smooth navigation helper
  const navigateTo = (path: string) => {
    // Add a small delay to allow state updates to complete
    // and animations to start before navigation
    setTimeout(() => {
      router.push(path)
    }, 50)
  }

  // Function to store auth data in localStorage
  const login = (address: string, walletId?: string, walletType?: string) => {
    const data: AuthData = { address, walletId, walletType }
    
    // Store in state
    setAuthData(data)
    setIsAuthenticated(true)
    
    // Store in localStorage for persistence across refreshes
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
    
    // Set session active flag
    sessionStorage.setItem(SESSION_KEY, "true")
    
    // Store passkey info if applicable
    if (walletType === "passkey") {
      localStorage.setItem(PASSKEY_STORAGE_KEY, "true")
    }
    
    console.log("Logged in with address:", address)
    
    // Only redirect to home if not already there
    if (window.location.pathname !== "/home") {
      router.push("/home")
    } else {
      console.log("Already on home page, no redirect needed")
    }
  }

  // Function to clear auth data
  const logout = () => {
    console.log("AuthContext: logout called")
    
    // Clear session flag first
    sessionStorage.removeItem(SESSION_KEY)
    
    // Clear state 
    setAuthData(null)
    setIsAuthenticated(false)
    
    // Clear localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(PASSKEY_STORAGE_KEY)
    
    // Clear any other relevant storage
    try {
      // Try to clear ThirdWeb's connection data from localStorage
      // This helps ensure a clean disconnect
      const thirdwebKeys = Object.keys(localStorage).filter(key => 
        key.includes('thirdweb') || 
        key.includes('wallet') || 
        key.includes('account')
      )
      
      for (const key of thirdwebKeys) {
        localStorage.removeItem(key)
      }
    } catch (e) {
      console.error("Error clearing additional storage:", e)
    }
    
    console.log("AuthContext: Logged out completely, address cleared")
  }

  // Auto-login on component mount if we have stored auth data
  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Check if there's an active session
        const hasActiveSession = sessionStorage.getItem(SESSION_KEY) === "true"
        
        // Get stored auth data
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
        if (!storedAuth) return
        
        const authData: AuthData = JSON.parse(storedAuth)
        
        // Skip autoLogin redirect if we're already on the home page
        // This prevents redirect loops
        const isOnHomePage = window.location.pathname === "/home"
        const shouldRedirect = window.location.pathname === "/" && hasActiveSession
        
        // Always restore auth state if we have stored data
        if (authData.walletId) {
          try {
            // Try to reconnect with the wallet if we have a walletId
            const wallet = createWallet(authData.walletId as any)
            const account = await wallet.getAccount()
            
            if (account) {
              // Update auth state
              setAuthData(authData)
              setIsAuthenticated(true)
              console.log("Auto-reconnected to wallet:", authData.walletId)
              
              // Restore session
              sessionStorage.setItem(SESSION_KEY, "true")
              
              // Redirect if appropriate
              if (shouldRedirect && !isOnHomePage) {
                router.push("/home")
              }
            }
          } catch (e) {
            console.log("Could not auto-reconnect wallet, using address only", e)
            // Fall back to just using the stored address
            setAuthData(authData)
            setIsAuthenticated(true)
            
            // Restore session
            sessionStorage.setItem(SESSION_KEY, "true")
            
            // Redirect if appropriate
            if (shouldRedirect && !isOnHomePage) {
              router.push("/home")
            }
          }
        } else if (authData.address) {
          // Just use the stored address
          setAuthData(authData)
          setIsAuthenticated(true)
          console.log("Using stored address:", authData.address)
          
          // Restore session
          sessionStorage.setItem(SESSION_KEY, "true")
          
          // Redirect if appropriate
          if (shouldRedirect && !isOnHomePage) {
            router.push("/home")
          }
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