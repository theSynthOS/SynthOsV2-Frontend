import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_address, protocol_id, protocol_pair_id, amount } = body

    const response = await fetch(
      "https://synthos-backend-production.up.railway.app/action/deposit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_address,
          protocol_id,
          protocol_pair_id,
          amount,
        }),
      }
    );


    if (!response.ok) {
      const error = await response.json()
      console.error('Deposit API Error:', {
        status: response.status,
        statusText: response.statusText,
        error
      })
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing deposit:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to process deposit', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 