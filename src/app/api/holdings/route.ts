import { NextResponse } from "next/server";
import { apiEndpoints } from "@/lib/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const response = await fetch(apiEndpoints.holdings(address));
    const data = await response.json();

    console.log("data", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching holdings:", error);
    return NextResponse.json(
      { error: "Failed to fetch holdings" },
      { status: 500 }
    );
  }
}
