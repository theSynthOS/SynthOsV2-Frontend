import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import {
  validateAndParseRequestBody,
  createErrorResponse,
} from "@/lib/api-utils";
import dotenv from "dotenv";
dotenv.config();

export async function POST(request: Request) {
  try {
    const processedBody = await validateAndParseRequestBody(
      request,
      ["depositId", "transactionHash"], // Required strings
      [], // No addresses
      ["blockNumber"], // Number field
      ["blockNumber"] // Optional (can be null/undefined)
    );

    const response = await fetch(apiEndpoints.updateDepositTx(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.X_API_KEY || "",
      },
      body: JSON.stringify(processedBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return createErrorResponse("Failed to process update deposit tx", 500);
  }
}
