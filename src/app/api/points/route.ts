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
    const user = await upsertUserPoints(checksummedAddress);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in points API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const user = await getUserPoints(checksummedAddress);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in points GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 