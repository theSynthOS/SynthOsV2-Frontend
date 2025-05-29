import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import { Transaction } from "@/app/models/transactions";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Direct database query for transactions
    const transactions = await Transaction.find({
      address: address.toLowerCase(),
    })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      transactions: transactions.map((tx) => ({
        id: tx.hash,
        protocolName: "AAVE",
        transfers: [
          {
            asset: "USDC",
            symbol: "USDC",
            amount: tx.amount,
            direction: tx.type === "deposit" ? "debit" : "credit",
          },
        ],
        txType: tx.type,
        summary: `${tx.type === "deposit" ? "Deposited" : "Withdrawn"} ${
          tx.amount
        } USDC`,
        timestamp: tx.createdAt.toISOString(),
        status: tx.status,
        chain: "Scroll Sepolia",
        protocolLogo: "/aave-logo.png",
        walletAddress: tx.address,
      })),
      metadata: {
        totalTransactions: transactions.length,
        totalSuccessful: transactions.filter((tx) => tx.status === "completed")
          .length,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
        lastUpdated: new Date().toISOString(),
        chain: "Scroll Sepolia",
        symbol: "USDC",
        explorer: "https://sepolia.scrollscan.com",
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { address, hash, amount, type, status } = body;

    // Validate required fields
    if (!address || !hash || amount === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save transaction
    const transaction = await Transaction.create({
      address,
      hash,
      amount,
      type,
      status,
    });

    return NextResponse.json({
      success: true,
      message: "Transaction saved successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error saving transaction:", error);
    return NextResponse.json(
      { success: false, message: "Error saving transaction" },
      { status: 500 }
    );
  }
}
