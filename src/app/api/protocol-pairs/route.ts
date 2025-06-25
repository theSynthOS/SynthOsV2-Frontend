import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";

export async function GET() {
  try {
    const response = await fetch(apiEndpoints.protocolPairs());
    if (!response.ok) {
      throw new Error("Failed to fetch protocol pairs");
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching protocol pairs:", error);
    return NextResponse.json(
      { error: "Failed to fetch protocol pairs" },
      { status: 500 }
    );
  }
}
