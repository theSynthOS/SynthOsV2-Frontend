import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import {
  validateAndChecksumURLParam,
  createErrorResponse,
} from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checksummedAddress = validateAndChecksumURLParam(
      searchParams,
      "address",
      true
    );

    const response = await fetch(apiEndpoints.holdings(checksummedAddress), {
      headers: {
        "X-API-Key": process.env.X_API_KEY || "",
      },
    });
    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return createErrorResponse("Failed to fetch holdings", 500);
  }
}
