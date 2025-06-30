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
    return NextResponse.json(
      { success: false, error: "Failed to process deposit points" },
      { status: 500 }
    );
  }
}
