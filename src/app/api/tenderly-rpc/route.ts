import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { method, params } = await req.json();

    if (method !== "tenderly_simulateBundle") {
      return NextResponse.json(
        { error: "Only tenderly_simulateBundle method is supported" },
        { status: 400 }
      );
    }

    // Tenderly RPC configuration
    const TENDERLY_NODE_ACCESS_KEY = process.env.TENDERLY_NODE_ACCESS_KEY;

    if (!TENDERLY_NODE_ACCESS_KEY) {
      console.error("Missing Tenderly Node access key");
      return NextResponse.json(
        { error: "Tenderly configuration missing" },
        { status: 500 }
      );
    }

    // Tenderly RPC URL for Scroll Mainnet
    const tenderlyRpcUrl = `https://scroll-mainnet.gateway.tenderly.co/${TENDERLY_NODE_ACCESS_KEY}`;

    console.log("🔍 Calling Tenderly RPC tenderly_simulateBundle...");
    console.log("Transactions to simulate:", params[0]?.length || 0);

    // Make RPC call to Tenderly
    const response = await fetch(tenderlyRpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method: "tenderly_simulateBundle",
        params: params,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tenderly RPC error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `Tenderly RPC error: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Log simulation results
    if (result.result && Array.isArray(result.result)) {
      console.log(
        `📊 Simulation completed: ${result.result.length} transactions`
      );

      const allPassed = result.result.every((sim: any) => sim.status === true);
      console.log(
        `🎯 Overall result: ${allPassed ? "✅ ALL PASSED" : "❌ SOME FAILED"}`
      );

      result.result.forEach((sim: any, index: number) => {
        const status = sim.status === true ? "✅" : "❌";
        const gasUsed = parseInt(sim.gasUsed || "0x0", 16);
        console.log(
          `${status} Transaction ${index + 1}: Gas ${gasUsed}, Status: ${
            sim.status
          }`
        );

        // Log any failure details
        if (sim.status !== true) {
          console.log(`   ❌ Failure details:`, {
            error: sim.error,
            revertReason: sim.revertReason,
            logs: sim.logs?.length || 0,
          });
        }
      });
    }

    if (result.error) {
      console.error("❌ Tenderly simulation error:", result.error);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tenderly RPC endpoint error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
