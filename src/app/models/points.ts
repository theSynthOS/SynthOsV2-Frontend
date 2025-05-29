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
    console.log("Created new user in points:", user);
  } else {
    // Do not increase pointsLogin if user already exists
    console.log("User already exists in points:", user);
  }
  return user;
}
