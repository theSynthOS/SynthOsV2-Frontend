import { NextRequest, NextResponse } from "next/server";
import {
  upsertUserPoints,
  getUserPoints,
  applyReferralCode,
  UserPoints,
  applyAndIncrementReferral,
} from "@/app/models/points";
import dbConnect from "../../lib/mongodb";

// Check if referral code exists and is valid
export async function POST(request: NextRequest) {
  await dbConnect();
  const { address, referralCode } = await request.json();

  console.log("Received referral request:", { address, referralCode });

  if (
    !address ||
    !referralCode ||
    address.trim() === "" ||
    referralCode.trim() === ""
  ) {
    return NextResponse.json(
      { success: false, error: "Address and referral code required" },
      { status: 400 }
    );
  }

  try {
    await applyAndIncrementReferral(address, referralCode);
    return NextResponse.json({
      success: true,
      message: "Referral code applied and referrer updated",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// Get user's referral information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    let user = await getUserPoints(address);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // If user doesn't have a referral code, create one
    if (!user.referralCode) {
      user = await upsertUserPoints(address);
    }

    const response = {
      success: true,
      user: {
        address: user.address,
        referralCode: user.referralCode,
        referralBy: user.referralBy,
        points: {
          pointsLogin: user.pointsLogin,
          pointsDeposit: user.pointsDeposit,
          pointsFeedback: user.pointsFeedback,
          pointsShareX: user.pointsShareX,
          pointsTestnetClaim: user.pointsTestnetClaim,
          pointsReferral: user.pointsReferral,
        },
      },
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
