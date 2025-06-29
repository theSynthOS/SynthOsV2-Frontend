import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import { validateAndChecksumURLParam, createErrorResponse } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checksummedAddress = validateAndChecksumURLParam(searchParams, 'address');
    
    const response = await fetch(apiEndpoints.holdings(checksummedAddress));
    const data = await response.json();

    console.log("data", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching holdings:", error);
    if (error instanceof Error && error.message.includes('address')) {
      return createErrorResponse(error, 400);
    }
    return createErrorResponse("Failed to fetch holdings", 500);
  }
}
