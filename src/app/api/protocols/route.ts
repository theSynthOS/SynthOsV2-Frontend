import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";

export async function GET() {
  try {
    const response = await fetch(apiEndpoints.protocols(), {
      headers: {
        "X-API-Key": process.env.X_API_KEY || "",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch protocols");
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch protocols" },
      { status: 500 }
    );
  }
}
