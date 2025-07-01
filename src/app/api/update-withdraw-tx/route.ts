import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import {
  validateAndParseRequestBody,
  createErrorResponse,
} from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const processedBody = await validateAndParseRequestBody(
      request,
      ["transactionHash"], // Required strings
      [], // No addresses
      ["blockNumber"], // Number field
      [], // Optional (can be null)
      ["withdrawalIds"] // Array fields
    );

    console.log("processedBody", processedBody);

    const response = await fetch(apiEndpoints.updateWithdrawTx(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing update withdraw tx:", error);
    return createErrorResponse(
      error instanceof Error
        ? error.message
        : "Failed to process update withdraw tx",
      500
    );
  }
}
