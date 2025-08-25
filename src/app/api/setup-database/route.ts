import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Supabase environment variables",
          instructions: [
            "1. Create a .env.local file in your project root",
            "2. Add your Supabase credentials:",
            "   NEXT_PUBLIC_SUPABASE_URL=your_project_url",
            "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key",
          ],
        },
        { status: 500 }
      );
    }

    const supabase = await createClient(cookies());

    // Try to create the table using a simple insert to test if it exists
    const testData = {
      address: "test_setup_address",
      referralCode: "TESTSETUP",
    };

    try {
      // Try to insert test data
      const { error: insertError } = await supabase
        .from("points")
        .insert([testData]);

      if (insertError && insertError.code === "PGRST204") {
        // Table exists but missing columns
        return NextResponse.json(
          {
            success: false,
            error: "Table exists but missing required columns",
            instructions: [
              "1. Go to Supabase Dashboard → SQL Editor",
              "2. Run this SQL to add missing columns:",
              "   ALTER TABLE points ADD COLUMN IF NOT EXISTS pointsReferral INTEGER DEFAULT 0;",
              "   ALTER TABLE points ADD COLUMN IF NOT EXISTS pointsX INTEGER DEFAULT 0;",
              "   ALTER TABLE points ADD COLUMN IF NOT EXISTS pointsTG INTEGER DEFAULT 0;",
              "3. Refresh schema cache: NOTIFY pgrst, 'reload schema';",
            ],
          },
          { status: 500 }
        );
      }

      if (
        insertError &&
        (insertError.code === "PGRST116" ||
          insertError.message.includes("does not exist"))
      ) {
        // Table doesn't exist
        return NextResponse.json(
          {
            success: false,
            error: "Points table does not exist",
            instructions: [
              "1. Go to Supabase Dashboard → SQL Editor",
              "2. Run this SQL to create the table:",
              "   CREATE TABLE points (",
              "     id SERIAL PRIMARY KEY,",
              "     address TEXT UNIQUE NOT NULL,",
              "     pointsReferral INTEGER DEFAULT 0,",
              "     pointsX INTEGER DEFAULT 0,",
              "     pointsTG INTEGER DEFAULT 0,",
              "     referralCode TEXT UNIQUE NOT NULL,",
              "     referralBy TEXT,",
              "     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),",
              "     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
              "   );",
              "   CREATE INDEX idx_points_address ON points(address);",
              "   CREATE INDEX idx_points_referral_code ON points(referralCode);",
            ],
          },
          { status: 500 }
        );
      }

      // If we get here, table exists and works
      // Clean up test data
      await supabase
        .from("points")
        .delete()
        .eq("address", "test_setup_address");

      return NextResponse.json({
        success: true,
        message: "Database is properly configured and ready to use!",
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: error instanceof Error ? error.message : "Unknown error",
          instructions: [
            "1. Check your Supabase project is active",
            "2. Verify your environment variables are correct",
            "3. Ensure your Supabase project has the correct permissions",
          ],
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Setup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Database setup endpoint",
    usage: "POST to this endpoint to check and setup database",
    instructions: [
      "1. Ensure your .env.local file has Supabase credentials",
      "2. POST to this endpoint to check database status",
      "3. Follow the returned instructions if setup is needed",
    ],
  });
}
