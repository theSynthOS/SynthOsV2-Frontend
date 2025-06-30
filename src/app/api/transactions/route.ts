import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import { Transaction } from "@/app/models/transactions";
import { getAddress } from "viem";

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

    // Checksum the address to ensure it's properly formatted
    const checksummedAddress = getAddress(address);

    const transactions = await Transaction.find({
      address: { $regex: `^${checksummedAddress}$`, $options: "i" },
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
        chain: "Scroll",
        protocolLogo: "/aave-logo.png",
        walletAddress: tx.address,
      })),
      metadata: {
        totalTransactions: transactions.length,
        totalSuccessful: transactions.filter((tx) => tx.status === "completed")
          .length,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
        lastUpdated: new Date().toISOString(),
        chain: "Scroll",
        symbol: "USDC",
        explorer: "https://scrollscan.com/",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
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

    // Checksum the address to ensure it's properly formatted
    const checksummedAddress = getAddress(address);

    // Save transaction
    const transaction = await Transaction.create({
      address: checksummedAddress,
      hash,
      amount,
      type,
      status,
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to save transaction" },
      { status: 500 }
    );
  }
}
