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

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    if (!amount || parseFloat(amount) < 10) {
      return NextResponse.json(
        { success: false, error: "Amount must be >= 10 for referral points" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await getUserPoints(address);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.referralBy || user.referralBy.trim() === "") {
      return NextResponse.json({
        success: true,
        message: "No referral relationship found",
        pointsAdded: 0,
      });
    }

    if (user.referralStatus === 1) {
      return NextResponse.json({
        success: true,
        message: "Referral already processed",
        pointsAdded: 0,
      });
    }

    const referrer = await getUserPoints(user.referralBy);
    if (!referrer) {
      return NextResponse.json(
        { success: false, error: "Referrer not found" },
        { status: 404 }
      );
    }

    const session = await mongoose.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        await mongoose.model("UserPoints").findOneAndUpdate(
          { address: user.address },
          {
            $inc: { pointsReferral: 100 },
            $set: { referralStatus: 1 },
          },
          { session }
        );

        await mongoose
          .model("UserPoints")
          .findOneAndUpdate(
            { address: referrer.address },
            { $inc: { pointsReferral: 100 } },
            { session }
          );
      });

      result = {
        success: true,
        message: "Referral points added successfully",
        pointsAdded: 100,
        referrerAddress: referrer.address,
        newStatus: 1,
      };
    } catch (transactionError) {
      throw new Error("Failed to process referral points");
    } finally {
      await session.endSession();
    }

    return NextResponse.json(result);
  } catch (error) {
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

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await getUserPoints(address);
    if (!user) {
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

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
