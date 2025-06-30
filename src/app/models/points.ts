import mongoose, { Schema, models, model } from "mongoose";
import dbConnect from "../lib/mongodb";

// UserPoints schema
export type UserPoints = {
  email?: string; // optional
  address: string; // unique
  pointsLogin: number;
  pointsDeposit: number;
  pointsFeedback: number;
  pointsShareX: number;
  pointsTestnetClaim: number;
  pointsReferral: number;
  referralCode: string;
  referralBy: string;
};

const userPointsSchema = new Schema({
  email: { type: String, unique: true, sparse: true },
  address: { type: String, unique: true, required: true },
  pointsLogin: { type: Number, default: 0 },
  pointsDeposit: { type: Number, default: 0 },
  pointsFeedback: { type: Number, default: 0 },
  pointsShareX: { type: Number, default: 0 },
  pointsTestnetClaim: { type: Number, default: 0 },
  pointsReferral: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referralBy: { type: String, sparse: true },
});

const UserPoints = models.UserPoints || model("UserPoints", userPointsSchema);

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

// Upsert user: if not exists, create with 50 login points; if exists, do not increase login points
export async function upsertUserPoints(address: string, email?: string) {
  await dbConnect();
  let user = await UserPoints.findOne({ address });
  if (!user) {
    // Generate a unique referral code
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = generateReferralCode();
      const existingUser = await UserPoints.findOne({ referralCode });
      if (!existingUser) {
        isUnique = true;
      }
    }

    user = await UserPoints.create({
      email,
      address,
      pointsLogin: 50,
      pointsDeposit: 0,
      pointsFeedback: 0,
      pointsShareX: 0,
      pointsTestnetClaim: 0,
      pointsReferral: 0,
      referralCode: referralCode,
      referralBy: "",
    });
  } else {
    // If user exists but doesn't have a referral code, create one
    if (!user.referralCode) {
      console.log("🔄 Existing user has no referral code, creating one...");
      let referralCode;
      let isUnique = false;
      while (!isUnique) {
        referralCode = generateReferralCode();
        const existingUser = await UserPoints.findOne({ referralCode });
        if (!existingUser) {
          isUnique = true;
        }
      }

      user = await UserPoints.findOneAndUpdate(
        { address },
        { referralCode: referralCode },
        { new: true }
      );
      console.log("✅ Referral code created for existing user:", referralCode);
    }
  }
  return user;
}

// Apply referral code to a user
export async function applyReferralCode(
  userAddress: string,
  referralCode: string
) {
  await dbConnect();
  if (!userAddress || !referralCode)
    throw new Error("Address and referral code required");

  // Check if referral code exists
  const referrer = await UserPoints.findOne({ referralCode });
  if (!referrer) throw new Error("Invalid referral code");

  // Prevent self-referral
  if (referrer.address.toLowerCase() === userAddress.toLowerCase()) {
    throw new Error("You cannot refer yourself.");
  }

  // Check if user already has a referral
  const user = await UserPoints.findOne({ address: userAddress });
  if (user?.referralBy) throw new Error("User already has a referral");

  // Update user with referral
  const updatedUser = await UserPoints.findOneAndUpdate(
    { address: userAddress },
    { referralBy: referralCode },
    { new: true }
  );

  if (!updatedUser) throw new Error("User not found");

  return updatedUser;
}

// Add 5 points to pointsTestnetClaim for a user found by address
export async function addTestnetClaimPoints(address: string) {
  await dbConnect();
  if (!address) throw new Error("Address required");
  const user = await UserPoints.findOneAndUpdate(
    { address },
    { $inc: { pointsTestnetClaim: 5 } },
    { new: true }
  );
  if (!user) throw new Error("User not found");
  return user;
}

// Get user points by address
export async function getUserPoints(address: string) {
  await dbConnect();
  if (!address) throw new Error("Address required");
  return UserPoints.findOne({ address });
}

// Add 25 points to pointsDeposit for a user found by address
export async function addDepositPoints(address: string) {
  await dbConnect();
  if (!address) throw new Error("Address required");
  const user = await UserPoints.findOneAndUpdate(
    { address },
    { $inc: { pointsDeposit: 25 } },
    { new: true }
  );
  if (!user) throw new Error("User not found");
  return user;
}
