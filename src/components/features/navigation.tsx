"use client"

import { Home, Award, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="border-t border-gray-800 bg-[#0f0b22] shadow-lg">
      <div className="flex justify-around py-4 max-w-md mx-auto">
        <Link 
          href="/" 
          className={`flex flex-col items-center ${isActive('/home') ? 'text-white' : 'text-gray-500'}`}
        >
          <div className={`${isActive('/home') ? 'bg-purple-600/20  rounded-full' : ''}`}>
            <Home className={`h-6 w-6 ${isActive('/home') ? 'text-purple-500' : ''}`} />
          </div>
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link 
          href="/rewards" 
          className={`flex flex-col items-center ${isActive('/rewards') ? 'text-white' : 'text-gray-500'}`}
        >
          <div className={`${isActive('/rewards') ? 'bg-purple-600/20  rounded-full' : ''}`}>
            <Award className={`h-6 w-6 ${isActive('/rewards') ? 'text-purple-500' : ''}`} />
          </div>
          <span className="text-xs mt-1">Feeds</span>
        </Link>
        
        <Link 
          href="/holding" 
          className={`flex flex-col items-center ${isActive('/holding') ? 'text-white' : 'text-gray-500'}`}
        >
          <div className={`${isActive('/holding') ? 'bg-purple-600/20  rounded-full' : ''}`}>
            <Wallet className={`h-6 w-6 ${isActive('/holding') ? 'text-purple-500' : ''}`} />
          </div>
          <span className="text-xs mt-1">Holdings</span>
        </Link>
      </div>
    </div>
  )
}
