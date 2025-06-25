import { NextResponse } from "next/server";
import { addTestnetClaimPoints } from "@/app/models/points";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }
    const user = await addTestnetClaimPoints(address);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in testnet-claim API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 