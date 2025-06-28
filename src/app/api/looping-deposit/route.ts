import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_address, protocol_pair_id, amount } = body;

    const response = await fetch(apiEndpoints.loopingDeposit(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_address,
        protocol_pair_id,
        amount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Looping Deposit API Error:", {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing looping deposit:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to process looping deposit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
