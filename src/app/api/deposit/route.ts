import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import {
  validateAndParseRequestBody,
  createErrorResponse,
  withAddressValidation,
} from "@/lib/api-utils";

async function depositHandler(request: Request) {
  try {
    const processedBody = await validateAndParseRequestBody(
      request,
      ["user_address", "protocol_pair_id", "amount"],
      ["user_address"]
    );

    const response = await fetch(apiEndpoints.deposit(), {
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
  } catch {
    return createErrorResponse("Failed to process deposit", 500);
  }
}

export const POST = withAddressValidation(async (request: Request) => {
  try {
    return await depositHandler(request);
  } catch {
    return createErrorResponse("Failed to process deposit", 500);
  }
});
