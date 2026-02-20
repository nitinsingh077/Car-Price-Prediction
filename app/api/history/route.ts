import { NextResponse } from "next/server";
import { getPredictionHistory, clearPredictionHistory } from "@/lib/data-store";

// GET /api/history - Get prediction history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const history = await getPredictionHistory();
    const totalRecords = history.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const paginatedHistory = history.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      history: paginatedHistory,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prediction history" },
      { status: 500 },
    );
  }
}

// DELETE /api/history - Clear prediction history
export async function DELETE() {
  try {
    clearPredictionHistory();

    return NextResponse.json({
      success: true,
      message: "Prediction history cleared successfully",
    });
  } catch (error) {
    console.error("History clear error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear prediction history" },
      { status: 500 },
    );
  }
}
