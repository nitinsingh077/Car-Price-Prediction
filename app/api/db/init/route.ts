import { NextResponse } from "next/server";
import { initializeDatabase, getDatabaseStatus } from "@/lib/data-store";

// GET /api/db/init - Check database status
export async function GET() {
  try {
    const status = await getDatabaseStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("DB status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check database status" },
      { status: 500 },
    );
  }
}

// POST /api/db/init - Initialize database tables and seed data
export async function POST() {
  try {
    const result = await initializeDatabase();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      seeded: result.seeded,
    });
  } catch (error) {
    console.error("DB init error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize database" },
      { status: 500 },
    );
  }
}
