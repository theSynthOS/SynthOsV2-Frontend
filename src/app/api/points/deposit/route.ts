import { NextResponse } from "next/server";
import { addDepositPoints } from "@/app/models/points";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }
    const user = await addDepositPoints(address);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in deposit points API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 