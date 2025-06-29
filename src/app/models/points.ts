import mongoose, { Schema, models, model } from "mongoose";
import dbConnect from "../lib/mongodb";

// UserPoints schema
export type UserPoints = {
  email?: string;        // optional
  address: string;       // unique
  pointsLogin: number;
  pointsDeposit: number;
  pointsFeedback: number;
  pointsShareX: number;
  pointsTestnetClaim: number;
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

// Upsert user: if not exists, create with 50 login points; if exists, do not increase login points
export async function upsertUserPoints(address: string, email?: string) {
  await dbConnect();
  let user = await UserPoints.findOne({ address });
  if (!user) {
    user = await UserPoints.create({
      email,
      address,
      pointsLogin: 50,
      pointsDeposit: 0,
      pointsFeedback: 0,
      pointsShareX: 0,
      pointsTestnetClaim: 0,
    });
  }
  return user;
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
