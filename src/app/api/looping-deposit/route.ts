import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import dotenv from "dotenv";
dotenv.config();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_address, protocol_pair_id, amount } = body;

    const response = await fetch(apiEndpoints.loopingDeposit(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.X_API_KEY || "",
      },
      body: JSON.stringify({
        user_address,
        protocol_pair_id,
        amount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process looping deposit" },
      { status: 500 }
    );
  }
}
