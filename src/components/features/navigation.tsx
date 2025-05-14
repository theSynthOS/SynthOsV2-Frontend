"use client"

import { Home, Award, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export default function Navbar() {
  const router = useRouter()
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
  
  return (
    <div className={`border-t ${theme === 'dark' ? 'border-gray-800 bg-[#0f0b22]' : 'border-gray-200 bg-white'} transition-all duration-200 ${isScrolled ? 'shadow-lg' : ''}`}>
      <div className="flex justify-around py-4">
        <button onClick={() => router.push('/')} className="flex flex-col items-center">
          <Home className={`h-6 w-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
          <span className={`text-sm mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Home</span>
        </button>
        <button onClick={() => router.push('/rewards')} className="flex flex-col items-center">
          <Award className={`h-6 w-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          <span className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Feeds</span>
        </button>
        <button onClick={() => router.push('/holding')} className="flex flex-col items-center">
          <Wallet className={`h-6 w-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          <span className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Holdings</span>
        </button>
      </div>
    </div>
  )
}
