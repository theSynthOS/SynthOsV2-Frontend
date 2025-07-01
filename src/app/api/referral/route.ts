import { NextRequest, NextResponse } from "next/server";
import {
  upsertUserPoints,
  getUserPoints,
  applyReferralCode,
} from "@/app/models/points";

// Generate a random 8-character referral code with alphanumeric and symbols
function generateReferralCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if referral code exists and is valid
export async function POST(request: NextRequest) {
  try {
    const { address, referralCode } = await request.json();

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    // If referralCode is provided, apply it
    if (referralCode) {
      try {
        await applyReferralCode(address, referralCode);
        return NextResponse.json({
          success: true,
          message: "Referral code applied successfully",
        });
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    // If no referralCode, just upsert user (this will create referral code if user doesn't exist)
    const user = await upsertUserPoints(address);

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
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
