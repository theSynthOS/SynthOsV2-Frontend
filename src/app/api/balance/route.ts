import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import { validateAndChecksumURLParam, createErrorResponse } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checksummedAddress = validateAndChecksumURLParam(searchParams, 'address', true);

    const response = await fetch(apiEndpoints.balance(checksummedAddress || ""));
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching balance:", error);
    if (error instanceof Error && error.message.includes('address')) {
      return createErrorResponse(error, 400);
    }
    return createErrorResponse("Failed to fetch balance", 500);
  }
}
