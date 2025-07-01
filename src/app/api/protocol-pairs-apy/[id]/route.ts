import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import dotenv from "dotenv";
dotenv.config();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Protocol ID is required" },
        { status: 400 }
      );
    }

    // Use the correct backend endpoint for single protocol
    const backendUrl = `${apiEndpoints.protocolPairsApySingle(id)}`;

    const response = await fetch(backendUrl, {
      headers: {
        "X-API-Key": process.env.X_API_KEY || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch protocol: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch protocol details" },
      { status: 500 }
    );
  }
}
