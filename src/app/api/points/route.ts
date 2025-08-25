import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

// Generate a random referral code with alphabets only
function generateReferralCode(): string {
  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += alphabets.charAt(Math.floor(Math.random() * alphabets.length));
  }
  return result;
}

// Check if referral code already exists
async function isReferralCodeUnique(
  supabase: any,
  code: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("points")
    .select("referralCode")
    .eq("referralCode", code)
    .single();

  return !data; // Return true if no record found (code is unique)
}

// Generate unique referral code
async function generateUniqueReferralCode(supabase: any): Promise<string> {
  let code: string;
  let isUnique = false;

  do {
    code = generateReferralCode();
    isUnique = await isReferralCodeUnique(supabase, code);
  } while (!isUnique);

  return code;
}

// Create points table if it doesn't exist
async function ensurePointsTableExists(supabase: any): Promise<boolean> {
  try {
    // Check if table exists by trying to query it
    const { error } = await supabase.from("points").select("id").limit(1);

    // If no error, table exists
    if (!error) {
      console.log("Points table exists");
      return true;
    }

    // If error is about table not existing, we need to create it manually
    if (error.code === "PGRST116" || error.message.includes("does not exist")) {
      console.log(
        "Points table doesn't exist. Please create it manually in Supabase SQL Editor with this SQL:"
      );
      console.log(`
        CREATE TABLE points (
          id SERIAL PRIMARY KEY,
          address TEXT UNIQUE NOT NULL,
          "pointsReferral" INTEGER DEFAULT 0,
          "pointsX" INTEGER DEFAULT 0,
          "pointsTG" INTEGER DEFAULT 0,
          "referralCode" TEXT UNIQUE NOT NULL,
          "referralBy" TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_points_address ON points(address);
        CREATE INDEX idx_points_referral_code ON points("referralCode");
      `);
      return false;
    }

    return false;
  } catch (error) {
    console.error("Error checking table existence:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    console.log("GET /api/points - Address:", address);

    // Check if environment variables are set
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Database configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient(cookies());

    console.log("Supabase client created successfully");

    // Ensure table exists
    const tableExists = await ensurePointsTableExists(supabase);
    if (!tableExists) {
      return NextResponse.json(
        { error: "Failed to create database table" },
        { status: 500 }
      );
    }

    // Get user points data
    const { data, error } = await supabase
      .from("points")
      .select("*")
      .eq("address", address)
      .single();

    console.log("Database query result:", { data, error });

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Database error:", error);

      // Check if it's a missing column error
      if (error.code === "PGRST204") {
        return NextResponse.json(
          {
            error: "Table exists but missing required columns",
            details: error.message,
            code: error.code,
            instructions: [
              "1. Go to Supabase Dashboard → SQL Editor",
              "2. Run this SQL to add missing columns:",
              '   ALTER TABLE points ADD COLUMN IF NOT EXISTS "pointsReferral" INTEGER DEFAULT 0;',
              '   ALTER TABLE points ADD COLUMN IF NOT EXISTS "pointsX" INTEGER DEFAULT 0;',
              '   ALTER TABLE points ADD COLUMN IF NOT EXISTS "pointsTG" INTEGER DEFAULT 0;',
              "3. Refresh schema cache: NOTIFY pgrst, 'reload schema';",
              "4. Try connecting your wallet again",
            ],
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch points data", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    console.error("Points GET error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, referralCode } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    console.log(
      "POST /api/points - Address:",
      address,
      "ReferralCode:",
      referralCode
    );

    // Check if environment variables are set
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Database configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient(cookies());

    console.log("Supabase client created successfully");

    // Ensure table exists
    const tableExists = await ensurePointsTableExists(supabase);
    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Points table does not exist",
          instructions: [
            "1. Go to Supabase Dashboard → SQL Editor",
            "2. Run this SQL to create the table:",
            "   CREATE TABLE points (",
            "     id SERIAL PRIMARY KEY,",
            "     address TEXT UNIQUE NOT NULL,",
            '     "pointsReferral" INTEGER DEFAULT 0,',
            '     "pointsX" INTEGER DEFAULT 0,',
            '     "pointsTG" INTEGER DEFAULT 0,',
            '     "referralCode" TEXT UNIQUE NOT NULL,',
            '     "referralBy" TEXT,',
            "     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),",
            "     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
            "   );",
            "   CREATE INDEX idx_points_address ON points(address);",
            '   CREATE INDEX idx_points_referral_code ON points("referralCode");',
            "3. Refresh schema cache: NOTIFY pgrst, 'reload schema';",
          ],
        },
        { status: 500 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("points")
      .select("*")
      .eq("address", address)
      .single();

    console.log("Check user existence result:", { existingUser, checkError });

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Database check error:", checkError);
      return NextResponse.json(
        {
          error: "Failed to check user existence",
          details: checkError.message,
          code: checkError.code,
        },
        { status: 500 }
      );
    }

    // If user exists, return existing data
    if (existingUser) {
      return NextResponse.json({
        success: true,
        data: existingUser,
        message: "User already exists",
      });
    }

    console.log("User does not exist, creating new user...");

    // Generate unique referral code for new user
    const newReferralCode = await generateUniqueReferralCode(supabase);
    console.log("Generated referral code:", newReferralCode);

    // Create new user record
    const newUser = {
      address,
      pointsReferral: 0,
      pointsX: 0,
      pointsTG: 0,
      referralCode: newReferralCode,
      referralBy: referralCode || null,
    };

    console.log("Creating user with data:", newUser);

    const { data: createdUser, error: createError } = await supabase
      .from("points")
      .insert([newUser])
      .select()
      .single();

    console.log("User creation result:", { createdUser, createError });

    if (createError) {
      console.error("User creation error:", createError);

      // Check if it's a missing column error
      if (createError.code === "PGRST204") {
        return NextResponse.json(
          {
            error: "Table exists but missing required columns",
            details: createError.message,
            code: createError.code,
            instructions: [
              "1. Go to Supabase Dashboard → SQL Editor",
              "2. Run this SQL to add missing columns:",
              '   ALTER TABLE points ADD COLUMN IF NOT EXISTS "pointsReferral" INTEGER DEFAULT 0;',
              '   ALTER TABLE points ADD COLUMN IF NOT EXISTS "pointsX" INTEGER DEFAULT 0;',
              '   ALTER TABLE points ADD COLUMN IF NOT EXISTS "pointsTG" INTEGER DEFAULT 0;',
              "3. Refresh schema cache: NOTIFY pgrst, 'reload schema';",
              "4. Try connecting your wallet again",
            ],
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to create user",
          details: createError.message,
          code: createError.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: createdUser,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Points POST error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
