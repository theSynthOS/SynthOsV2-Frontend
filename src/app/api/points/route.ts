import { NextResponse } from "next/server";
import { upsertUserPoints, getUserPoints } from "@/app/models/points";
import { getAddress } from "viem";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }
    // Checksum the address to ensure it's properly formatted
    const checksummedAddress = getAddress(address);
    console.log("Upserting user:", checksummedAddress);
    const user = await upsertUserPoints(checksummedAddress);
    console.log("User upserted:", user);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/points error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process points" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }
    // Checksum the address to ensure it's properly formatted
    const checksummedAddress = getAddress(address);

    // Use upsertUserPoints instead of getUserPoints to create user if not exists
    const user = await upsertUserPoints(checksummedAddress);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/points error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process points" },
      { status: 500 }
    );
  }
}
