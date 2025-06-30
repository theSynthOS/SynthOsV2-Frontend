import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";
import { getAddress } from "viem";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    // Checksum the address to ensure it's properly formatted
    const checksummedAddress = getAddress(address);
    const response = await fetch(apiEndpoints.aiAnalyzer(checksummedAddress));
    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
