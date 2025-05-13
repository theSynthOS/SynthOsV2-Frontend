'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

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
  return (
    <>
      <div className="fixed top-0 left-0 right-0">
        <Header />
      </div>
      <AuthProvider>
        {children}
      </AuthProvider>
      <div className="fixed bottom-0 left-0 right-0">
        <Navbar />
      </div>
    </>
  )
} 