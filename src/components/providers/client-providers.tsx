'use client'

import dynamic from 'next/dynamic'
import { ReactNode, useState } from 'react'
import PullToRefresh from "@/components/features/pull-to-refresh"
import { useRouter } from 'next/navigation'
import { ThemeProvider } from 'next-themes'

// Lazy load components that aren't needed immediately
const AuthProvider = dynamic(() => import("@/contexts/AuthContext").then(mod => mod.AuthProvider), {
  ssr: false
})
const Navbar = dynamic(() => import("@/components/features/navigation"), {
  ssr: false
})
const Header = dynamic(() => import("@/components/features/header"), {
  ssr: false
})

interface ClientProvidersProps {
  children: ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const router = useRouter()
  
  // Handle refresh action for global pull-to-refresh
  const handleGlobalRefresh = async () => {
    console.log("Global refresh triggered")
    
    // Simulate API call or data refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Refresh the current page
    router.refresh()
    
    console.log("Global refresh complete")
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <div className="fixed top-0 left-0 right-0 bg-[#0f0b22] z-50">
          <Header />
        </div>
        <PullToRefresh onRefresh={handleGlobalRefresh}>
          {children}
        </PullToRefresh>
        <div className="fixed bottom-0 left-0 right-0">
          <Navbar />
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
} 