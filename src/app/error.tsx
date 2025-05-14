"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0b22] text-white p-4">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-gray-400 mb-8 text-center">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-purple-700 hover:bg-purple-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Try again
        </button>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Return Home
        </button>
      </div>
    </div>
  )
} 