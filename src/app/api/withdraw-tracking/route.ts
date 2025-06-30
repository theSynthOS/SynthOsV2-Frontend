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
      ["user_address", "protocol_pair_id", "amount"],
      ["user_address"],
      [],
      ["withdrawToken"]
    );

    console.log("processedBody", processedBody);

    const response = await fetch(apiEndpoints.withdrawTracking(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Withdraw API Error:", {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing withdraw:", error);
    if (error instanceof Error && error.message.includes("address")) {
      return createErrorResponse(error, 400);
    }
    return createErrorResponse("Failed to process withdraw", 500);
  }
}
