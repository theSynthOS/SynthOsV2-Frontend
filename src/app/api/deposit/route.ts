import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import { validateAndParseRequestBody, createErrorResponse, withAddressValidation } from "@/lib/api-utils";

async function depositHandler(request: Request) {
  try {
    const processedBody = await validateAndParseRequestBody(
      request,
      ['user_address', 'protocol_pair_id', 'amount'],
      ['user_address']
    );

    console.log("processedBody", processedBody);

  const response = await fetch(apiEndpoints.deposit(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(processedBody),
  });


  if (!response.ok) {
    const error = await response.json();
    console.error("Deposit API Error:", {
      status: response.status,
      statusText: response.statusText,
      error,
    });
    return NextResponse.json(error, { status: response.status });
  }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    throw error;
  }
}

export const POST = withAddressValidation(async (request: Request) => {
  try {
    return await depositHandler(request);
  } catch (error) {
    console.error("Error processing deposit:", error);
    return createErrorResponse("Failed to process deposit", 500);
  }
});
