import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";

export async function GET() {
  try {
    const response = await fetch(apiEndpoints.protocolPairsApy());

    if (!response.ok) {
      throw new Error("Failed to fetch protocol pairs");
    }

    const data = await response.json();
    console.log("data", data);

    // Backend already provides protocol_id and logo_url, so just return the data as-is
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching protocol pairs:", error);
    return NextResponse.json(
      { error: "Failed to fetch protocol pairs" },
      { status: 500 }
    );
  }
}
