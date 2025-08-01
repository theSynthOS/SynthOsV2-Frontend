import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get Alchemy URL from environment variable
    const ALCHEMY_URL = process.env.ALCHEMY_SCROLL_URL;
    
    // Use Alchemy's RPC endpoint with API key
    const response = await fetch(ALCHEMY_URL || "", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `RPC error: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Add CORS headers
    const responseWithCors = NextResponse.json(result);
    responseWithCors.headers.set('Access-Control-Allow-Origin', '*');
    responseWithCors.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseWithCors.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return responseWithCors;
  } catch (error) {
    console.error("RPC proxy error:", error);
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    
    // Get Alchemy URL from environment variable
    const ALCHEMY_URL = process.env.ALCHEMY_SCROLL_URL;
    
    // Use Alchemy's RPC endpoint with API key
    const response = await fetch(`${ALCHEMY_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `RPC error: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Add CORS headers
    const responseWithCors = NextResponse.json(result);
    responseWithCors.headers.set('Access-Control-Allow-Origin', '*');
    responseWithCors.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseWithCors.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return responseWithCors;
  } catch (error) {
    console.error("RPC proxy error:", error);
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
} 