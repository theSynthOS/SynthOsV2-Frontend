"use client"

import { Home, Award, Wallet, Settings, Search, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export default function Header() {
    const router = useRouter()
    const { theme } = useTheme()
    
    return (
        <div className={`flex justify-between items-center p-4 ${theme === 'dark' ? 'bg-[#0f0b22] border-gray-700/0 hover:border-gray-700' : 'bg-white border-gray-200/0 hover:border-gray-200'} border-b`}>
            <button className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center`}>
                <History className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
            <div className="relative flex-1 mx-4">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input
                    type="text"
                    placeholder="Search protocols"
                    className={`w-full ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                />
            </div>
            
            <button 
                className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center`}
                onClick={() => router.push("/setting")}
            >
                <Settings className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
        </div>
    )
}
