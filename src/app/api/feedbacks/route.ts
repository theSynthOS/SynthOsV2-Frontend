import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import { Feedback } from "@/app/models/feedbacks";
import mongoose from "mongoose";

const UserPoints =
  mongoose.models.UserPoints ||
  mongoose.model(
    "UserPoints",
    new mongoose.Schema({
      email: { type: String, unique: true, required: true },
      address: { type: String, unique: true, required: true },
      pointsLogin: { type: Number, default: 0 },
      pointsDeposit: { type: Number, default: 0 },
      pointsFeedback: { type: Number, default: 0 },
      pointsShareX: { type: Number, default: 0 },
      pointsTestnetClaim: { type: Number, default: 0 },
    })
  );

export async function POST(req: Request) {
  try {
    console.log("Connecting to database...");
    await dbConnect();
    console.log("Database connected successfully");

    const body = await req.json();
    console.log("Received feedback data:", body);
    const {
      walletAddress,
      email,
      protocols,
      strategies,
      rating,
      additionalFeedback,
    } = body;

    // Validate required fields
    if (!walletAddress || !email || !protocols || !strategies || !rating) {
      console.error("Missing required fields:", {
        walletAddress,
        email,
        protocols,
        strategies,
        rating,
      });
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has already submitted feedback
    console.log("Checking for existing feedback for address:", walletAddress);
    const existingFeedback = await Feedback.findOne({ walletAddress });
    const hasSubmittedBefore = !!existingFeedback;
    console.log("Has submitted before:", hasSubmittedBefore);

    // Create new feedback
    console.log("Creating new feedback...");
    const feedback = await Feedback.create({
      walletAddress,
      email,
      protocols,
      strategies,
      rating,
      additionalFeedback: additionalFeedback || "",
    });
    console.log("Feedback created:", feedback);

    // If this is their first submission, award points
    if (!hasSubmittedBefore) {
      console.log("Awarding points for first submission...");
      try {
        const updatedPoints = await UserPoints.findOneAndUpdate(
          { address: walletAddress },
          { $inc: { pointsFeedback: 150 } },
          { upsert: true, new: true }
        );
        console.log("Points updated:", updatedPoints);
      } catch (error) {
        console.error("Error updating points:", error);
        // Continue even if points update fails - we still want to save the feedback
      }
    } else {
      console.log("No points awarded - user has submitted feedback before");
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      pointsAwarded: !hasSubmittedBefore ? 150 : 0,
      feedbackId: feedback._id,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { success: false, message: "Error submitting feedback" },
      { status: 500 }
    );
  }
}
