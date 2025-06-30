import { NextRequest, NextResponse } from "next/server";
import { getUserPoints } from "@/app/models/points";
import dbConnect from "../../lib/mongodb";
import mongoose from "mongoose";

// Referral points proxy API
// Rules:
// 1. Only process when amount >= 10
// 2. Check referralBy and referralStatus
// 3. If referralBy is null/empty, ignore
// 4. If referralBy exists and referralStatus is 1, ignore
// 5. If referralBy exists and referralStatus is 0, add 100 points to both users and set referralStatus to 1

export async function POST(request: NextRequest) {
  try {
    const { address, amount } = await request.json();

    console.log(
      "🔍 POST /api/referral-points - Address:",
      address,
      "Amount:",
      amount
    );

    if (!address) {
      console.log("❌ No address provided");
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    if (!amount || parseFloat(amount) < 10) {
      console.log("❌ Amount is less than 10, ignoring referral points");
      return NextResponse.json(
        { success: false, error: "Amount must be >= 10 for referral points" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user data
    const user = await getUserPoints(address);
    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    console.log("📊 User data:", {
      address: user.address,
      referralBy: user.referralBy,
      referralStatus: user.referralStatus,
      pointsReferral: user.pointsReferral,
    });

    // Rule 3: If referralBy is null or empty, ignore
    if (!user.referralBy || user.referralBy.trim() === "") {
      console.log("❌ No referralBy found, ignoring");
      return NextResponse.json({
        success: true,
        message: "No referral relationship found",
        pointsAdded: 0,
      });
    }

    // Rule 4: If referralStatus is 1, ignore (already processed)
    if (user.referralStatus === 1) {
      console.log("❌ Referral already processed (status = 1), ignoring");
      return NextResponse.json({
        success: true,
        message: "Referral already processed",
        pointsAdded: 0,
      });
    }

    // Rule 5: Process referral points
    console.log("✅ Processing referral points...");

    // Get the referrer user
    const referrer = await getUserPoints(user.referralBy);
    if (!referrer) {
      console.log("❌ Referrer not found");
      return NextResponse.json(
        { success: false, error: "Referrer not found" },
        { status: 404 }
      );
    }

    // Start a transaction to ensure data consistency
    const session = await mongoose.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        // Update current user: add 100 points and set referralStatus to 1
        await mongoose.model("UserPoints").findOneAndUpdate(
          { address: user.address },
          {
            $inc: { pointsReferral: 100 },
            $set: { referralStatus: 1 },
          },
          { session }
        );

        // Update referrer: add 100 points
        await mongoose
          .model("UserPoints")
          .findOneAndUpdate(
            { address: referrer.address },
            { $inc: { pointsReferral: 100 } },
            { session }
          );
      });

      console.log("✅ Referral points processed successfully");
      result = {
        success: true,
        message: "Referral points added successfully",
        pointsAdded: 100,
        referrerAddress: referrer.address,
        newStatus: 1,
      };
    } catch (transactionError) {
      console.error("❌ Transaction failed:", transactionError);
      throw new Error("Failed to process referral points");
    } finally {
      await session.endSession();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("🚨 POST /api/referral-points error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET method to check referral status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    console.log("🔍 GET /api/referral-points - Address:", address);

    if (!address) {
      console.log("❌ No address provided");
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await getUserPoints(address);
    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const response = {
      success: true,
      referralData: {
        address: user.address,
        referralBy: user.referralBy,
        referralStatus: user.referralStatus,
        pointsReferral: user.pointsReferral,
        canEarnReferralPoints:
          user.referralBy &&
          user.referralBy.trim() !== "" &&
          user.referralStatus === 0,
      },
    };

    console.log("📤 Sending referral status:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("🚨 GET /api/referral-points error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
