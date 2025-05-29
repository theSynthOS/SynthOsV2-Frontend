import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true },
  email: { type: String, required: true },
  protocols: { type: [String], required: true },
  strategies: { type: [String], required: true },
  rating: { type: Number, required: true },
  additionalFeedback: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
