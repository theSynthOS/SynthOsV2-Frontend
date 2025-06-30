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
      ["depositId", "transactionHash"], // Required strings
      [], // No addresses
      ["blockNumber"], // Number field
      [] // Optional (can be null)
    );

    const response = await fetch(apiEndpoints.updateDepositTx(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Update Deposit Tx API Error:", {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing update deposit tx:", error);
    if (error instanceof Error && error.message.includes("address")) {
      return createErrorResponse(error, 400);
    }
    return createErrorResponse("Failed to process update deposit tx", 500);
  }
}
