import { NextResponse } from "next/server";
import { addTestnetClaimPoints } from "@/app/models/points";

export async function POST(req: Request) {
  try {
    const { email, address } = await req.json();
    if (!email && !address) {
      return NextResponse.json({ error: "Missing email or address" }, { status: 400 });
    }
    const user = await addTestnetClaimPoints({ email, address });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in testnet-claim API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 