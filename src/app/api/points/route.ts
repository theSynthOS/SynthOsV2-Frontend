import { NextResponse } from "next/server";
import { upsertUserPoints, getUserPoints } from "@/app/models/points";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }
    const user = await upsertUserPoints(address);
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
    const user = await getUserPoints(address);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in points GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 