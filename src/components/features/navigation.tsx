"use client"

import { Home, Award, Wallet } from "lucide-react"
import Link from "next/link"

export default function Navbar() {
  return (
    <div className="border-t border-gray-800 bg-[#0f0b22]">
      <div className="flex justify-around py-4">
        <Link href="/" className="flex flex-col items-center">
          <Home className="h-6 w-6" />
          <span className="text-sm mt-1">Home</span>
        </Link>
        <Link href="/rewards" className="flex flex-col items-center text-gray-500">
          <Award className="h-6 w-6" />
          <span className="text-sm mt-1">Feeds</span>
        </Link>
        <Link href="/holding" className="flex flex-col items-center text-gray-500">
          <Wallet className="h-6 w-6" />
          <span className="text-sm mt-1">Holdings</span>
        </Link>
      </div>
    </div>
  )
}
