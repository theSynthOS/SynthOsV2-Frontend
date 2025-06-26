import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";

interface Protocol {
  id: number;
  name: string;
  logo_url: string;
}

interface Pair {
  name: string;
  // other pair properties
}

export async function GET() {
  try {
    const [pairsResponse, protocolsResponse] = await Promise.all([
      fetch(apiEndpoints.protocolPairsApy()),
      fetch(apiEndpoints.protocols()),
    ]);

    if (!pairsResponse.ok) {
      throw new Error("Failed to fetch protocol pairs");
    }
    if (!protocolsResponse.ok) {
      throw new Error("Failed to fetch protocols");
    }

    const pairs: Pair[] = await pairsResponse.json();
    const protocols: Protocol[] = await protocolsResponse.json();

    const protocolsMap = new Map(
      protocols.map((p: Protocol) => [
        p.name,
        { id: p.id, logo_url: p.logo_url },
      ])
    );

    const enrichedPairs = pairs.map((pair: Pair) => {
      const protocolInfo = protocolsMap.get(pair.name);
      return {
        ...pair,
        protocol_id: protocolInfo ? protocolInfo.id : null,
        logo_url: protocolInfo ? protocolInfo.logo_url : null,
      };
    });

    return NextResponse.json(enrichedPairs);
  } catch (error) {
    console.error("Error fetching protocol pairs:", error);
    return NextResponse.json(
      { error: "Failed to fetch protocol pairs" },
      { status: 500 }
    );
  }
}
