import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Draw } from "@/models";

// GET /api/draws — public list of all published draws
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const draws = await Draw.find({ status: "completed" })
      .select("period status drawMode drawnNumbers totalPoolPence jackpotPoolPence fourMatchPoolPence threeMatchPoolPence jackpotRolledOverPence winners eligibleSubscriberCount runAt publishedAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get pending draw (current month)
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const pending = await Draw.findOne({
      period: currentPeriod,
      status: { $in: ["pending", "running"] },
    }).lean();

    return NextResponse.json({ draws, pending: pending ?? null });
  } catch (err) {
    console.error("[draws GET]", err);
    return NextResponse.json({ error: "Failed to fetch draws." }, { status: 500 });
  }
}
