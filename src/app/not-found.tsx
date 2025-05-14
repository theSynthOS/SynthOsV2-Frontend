"use client"

import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0b22] text-white p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-6">Page Not Found</h2>
      <p className="text-gray-400 mb-8 text-center">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => router.push('/')}
        className="bg-purple-700 hover:bg-purple-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
      >
        Return Home
      </button>
    </div>
  )
} 