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
      return NextResponse.json(
        { error: "Tenderly configuration missing" },
        { status: 500 }
      );
    }

    // Tenderly RPC URL for Scroll Mainnet
    const tenderlyRpcUrl = `https://scroll-mainnet.gateway.tenderly.co/${TENDERLY_NODE_ACCESS_KEY}`;

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
      return NextResponse.json(
        {
          error: `Tenderly RPC error: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.result && Array.isArray(result.result)) {
      const allPassed = result.result.every((sim: any) => sim.status === true);

      result.result.forEach((sim: any, index: number) => {
        const status = sim.status === true ? "✅" : "❌";
        const gasUsed = parseInt(sim.gasUsed || "0x0", 16);

        if (sim.status !== true) {
        }
      });
    }

    if (result.error) {
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
