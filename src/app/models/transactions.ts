import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  address: { type: String, required: true },
  hash: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, default: "deposit" },
  status: { type: String, required: true, default: "completed" },
  createdAt: { type: Date, default: Date.now },
});

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

// Function to save a new transaction
export async function saveTransaction({
  address,
  hash,
  amount,
  type = "deposit",
  status = "completed",
}: {
  address: string;
  hash: string;
  amount: number;
  type?: string;
  status?: string;
}) {
  try {
    const transaction = await Transaction.create({
      address,
      hash,
      amount,
      type,
      status,
    });
    return transaction;
  } catch (error) {
    throw error;
  }
}
