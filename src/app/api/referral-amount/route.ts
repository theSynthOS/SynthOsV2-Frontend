import { NextRequest, NextResponse } from "next/server";
import { getReferralAmount } from "@/app/models/points";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const referralAmount = await getReferralAmount(address);
  return NextResponse.json({ referralAmount });
}
