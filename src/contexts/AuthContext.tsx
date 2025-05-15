"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Auto-login on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth")
    if (storedAuth) {
      setIsAuthenticated(true)
      // If we're on the login page, redirect to protocol spotlight
      if (window.location.pathname === "/") {
        router.push("/protocol-spotlight")
      }
    }
  }, [router])

  const login = () => {
    setIsAuthenticated(true)
    localStorage.setItem("auth", "true")
    router.push("/protocol-spotlight")
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("auth")
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 