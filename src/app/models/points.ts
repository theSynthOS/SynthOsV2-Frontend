import mongoose, { Schema, models, model } from "mongoose";
import dbConnect from "../lib/mongodb";

// UserPoints schema
export type UserPoints = {
  email: string;         // unique
  address: string;       // unique
  pointsLogin: number;
  pointsDeposit: number;
  pointsFeedback: number;
  pointsShareX: number;
  pointsTestnetClaim: number;
};

const userPointsSchema = new Schema({
  email: { type: String, unique: true, required: true },
  address: { type: String, unique: true, required: true },
  pointsLogin: { type: Number, default: 0 },
  pointsDeposit: { type: Number, default: 0 },
  pointsFeedback: { type: Number, default: 0 },
  pointsShareX: { type: Number, default: 0 },
  pointsTestnetClaim: { type: Number, default: 0 },
});

const UserPoints = models.UserPoints || model("UserPoints", userPointsSchema);

// Upsert user: if not exists, create with 50 login points; if exists, do not increase login points
export async function upsertUserPoints(email: string, address: string) {
  await dbConnect();
  let user = await UserPoints.findOne({ $or: [{ email }, { address }] });
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
  } else {
  }
  return user;
}

// Add 5 points to pointsTestnetClaim for a user found by email or address
export async function addTestnetClaimPoints({ email, address }: { email?: string, address?: string }) {
  await dbConnect();
  if (!email && !address) throw new Error("Email or address required");
  const user = await UserPoints.findOneAndUpdate(
    { $or: [email ? { email } : {}, address ? { address } : {}] },
    { $inc: { pointsTestnetClaim: 5 } },
    { new: true }
  );
  if (!user) throw new Error("User not found");
  return user;
}

// Get user points by email or address
export async function getUserPoints({ email, address }: { email?: string, address?: string }) {
  await dbConnect();
  if (!email && !address) throw new Error("Email or address required");
  return UserPoints.findOne({ $or: [email ? { email } : {}, address ? { address } : {}] });
}

// Add 25 points to pointsDeposit for a user found by email or address
export async function addDepositPoints({ email, address }: { email?: string, address?: string }) {
  await dbConnect();
  if (!email && !address) throw new Error("Email or address required");
  const user = await UserPoints.findOneAndUpdate(
    { $or: [email ? { email } : {}, address ? { address } : {}] },
    { $inc: { pointsDeposit: 25 } },
    { new: true }
  );
  if (!user) throw new Error("User not found");
  return user;
}
