import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      "https://synthos-backend-production.up.railway.app/protocol/protocol-pairs-apy"
    );
    if (!response.ok) {
      throw new Error('Failed to fetch protocol pairs')
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching protocol pairs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch protocol pairs' },
      { status: 500 }
    )
  }
} 