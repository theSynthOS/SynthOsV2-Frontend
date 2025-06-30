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

    console.log(
      "🔍 POST /api/referral - Address:",
      address,
      "ReferralCode:",
      referralCode
    );

    if (!address) {
      console.log("❌ No address provided");
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    // If referralCode is provided, apply it
    if (referralCode) {
      console.log("🔄 Applying referral code:", referralCode);
      try {
        await applyReferralCode(address, referralCode);
        console.log("✅ Referral code applied successfully");
        return NextResponse.json({
          success: true,
          message: "Referral code applied successfully",
        });
      } catch (error: any) {
        console.error("❌ Error applying referral code:", error.message);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    // If no referralCode, just upsert user (this will create referral code if user doesn't exist)
    console.log("🔄 Upserting user to create referral code if needed");
    const user = await upsertUserPoints(address);
    console.log("✅ User upserted, referral code:", user.referralCode);

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
    console.error("🚨 POST /api/referral error:", error);
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

    console.log("🔍 GET /api/referral - Address:", address);

    if (!address) {
      console.log("❌ No address provided");
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    let user = await getUserPoints(address);
    console.log("📊 User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("❌ User not found in database");
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // If user doesn't have a referral code, create one
    if (!user.referralCode) {
      console.log("🔄 User has no referral code, creating one...");
      user = await upsertUserPoints(address);
      console.log("✅ New referral code created:", user.referralCode);
    } else {
      console.log("✅ User already has referral code:", user.referralCode);
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

    console.log("📤 Sending response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("🚨 GET /api/referral error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
