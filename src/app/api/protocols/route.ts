import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      "http://localhost:8080/protocol/protocols"
    );
    if (!response.ok) {
      throw new Error('Failed to fetch protocols')
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching protocols:', error)
    return NextResponse.json(
      { error: 'Failed to fetch protocols' },
      { status: 500 }
    )
  }
} 