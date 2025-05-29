import { NextResponse } from "next/server";
import { upsertUserPoints } from "@/app/models/points";

export async function POST(req: Request) {
  try {
    const { email, address } = await req.json();
    console.log("/api/points POST received:", { email, address });
    if (!email || !address) {
      return NextResponse.json({ error: "Missing email or address" }, { status: 400 });
    }
    const user = await upsertUserPoints(email, address);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in points API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 