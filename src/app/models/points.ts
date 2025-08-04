import mongoose, { Schema, models, model } from "mongoose";
import dbConnect from "../lib/mongodb";

// UserPoints schema
export type UserPoints = {
  address: string; // unique
  email: string;
  pointsLogin: number;
  pointsDeposit: number;
  pointsFeedback: number;
  pointsShareX: number;
  pointsTestnetClaim: number;
  pointsReferral: number;
  referralCode: string;
  referralBy: string;
  referralAmount: number;
};

const userPointsSchema = new Schema({
  address: { type: String, unique: true, required: true },
  email: { type: String, sparse: true },
  pointsLogin: { type: Number, default: 0 },
  pointsDeposit: { type: Number, default: 0 },
  pointsFeedback: { type: Number, default: 0 },
  pointsShareX: { type: Number, default: 0 },
  pointsTestnetClaim: { type: Number, default: 0 },
  pointsReferral: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referralBy: { type: String, sparse: true },
  referralAmount: { type: Number, default: 0 },
  referralStatus: { type: Number, default: 0 },
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
  console.log("upsertUserPoints called with:", { address, email });
  await dbConnect();
  let user = await UserPoints.findOne({ address });
  console.log("Existing user found:", user);

  if (!user) {
    console.log("Creating new user");
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
      referralStatus: 0,
      referralAmount: 0,
    });
    console.log("New user created:", user);
  } else {
    if (!user.referralCode) {
      console.log("User exists but no referral code, generating one");
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
      console.log("User updated with referral code:", user);
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

  // Prevent self-referral (check this BEFORE checking if user already has referral)
  if (referrer.address.toLowerCase() === userAddress.toLowerCase()) {
    throw new Error("You cannot refer yourself.");
  }

  // Check if user already has a referral (only check if it's not a self-referral)
  const user = await UserPoints.findOne({ address: userAddress });
  if (user?.referralBy && user.referralBy.trim() !== "")
    throw new Error("User already has a referral");

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

export async function applyAndIncrementReferral(
  userAddress: string,
  referralCode: string
) {
  console.log("applyAndIncrementReferral called with:", {
    userAddress,
    referralCode,
  });
  await dbConnect();

  // 1. Find the referrer
  const referrer = await UserPoints.findOne({ referralCode });
  console.log("Found referrer:", referrer);
  if (!referrer) throw new Error("Invalid referral code");

  // 2. Prevent self-referral (check this BEFORE checking if user already has referral)
  if (referrer.address.toLowerCase() === userAddress.toLowerCase()) {
    console.log("Self-referral detected");
    throw new Error("You cannot refer yourself.");
  }

  // 3. Check if user already has a referral (only check if it's not a self-referral)
  let user = await UserPoints.findOne({ address: userAddress });
  console.log("Found user:", user);

  // If user doesn't exist, create them first
  if (!user) {
    console.log("User doesn't exist, creating them first");
    user = await upsertUserPoints(userAddress);
    console.log("User created:", user);
  }

  if (user?.referralBy && user.referralBy.trim() !== "") {
    console.log("User already has referral:", user.referralBy);
    throw new Error("User already has a referral");
  }

  // 4. Update current user's referralBy
  console.log("Updating user referralBy to:", referralCode);
  await UserPoints.updateOne(
    { address: userAddress },
    { referralBy: referralCode }
  );

  // 5. Increment referrer's referralAmount
  console.log("Incrementing referrer's referralAmount");
  await UserPoints.updateOne({ referralCode }, { $inc: { referralAmount: 1 } });

  console.log("applyAndIncrementReferral completed successfully");
  return true;
}

export async function getReferralAmount(address: string) {
  await dbConnect();
  const user = await UserPoints.findOne({ address });
  return user?.referralAmount || 0;
}
