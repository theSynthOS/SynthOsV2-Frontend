"use client"

import { Home, Award, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false)
  const { theme } = useTheme()
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className={`border-t ${theme === 'dark' ? 'border-gray-800 bg-[#0f0b22]' : 'border-gray-200 bg-white'} transition-all duration-200 ${isScrolled ? 'shadow-lg' : ''}`}>
      <div className="flex justify-around py-4 max-w-md mx-auto">
        <Link 
          href="/home" 
          className={`flex flex-col items-center ${isActive('/home') ? (theme === 'dark' ? 'text-white' : 'text-black') : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}
        >
          <div className={`p-2 rounded-full ${isActive('/home') ? (theme === 'dark' ? 'bg-purple-600/20' : 'bg-green-600/20') : ''}`}>
            <Home className={`h-6 w-6 ${isActive('/home') ? (theme === 'dark' ? 'text-purple-500' : 'text-green-500') : ''}`} />
          </div>
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        
        <Link 
          href="/holding" 
          className={`flex flex-col items-center ${isActive('/holding') ? (theme === 'dark' ? 'text-white' : 'text-black') : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}
        >
          <div className={`p-2 rounded-full ${isActive('/holding') ? (theme === 'dark' ? 'bg-purple-600/20' : 'bg-green-600/20') : ''}`}>
            <Wallet className={`h-6 w-6 ${isActive('/holding') ? (theme === 'dark' ? 'text-purple-500' : 'text-green-500') : ''}`} />
          </div>
          <span className="text-xs mt-1">Holdings</span>
        </Link>
      </div>
    </div>
  )
}
