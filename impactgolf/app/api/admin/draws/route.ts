import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Draw } from "@/models";

// GET /api/admin/draws — all draws with full detail
export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  await connectDB();
  const draws = await Draw.find()
    .sort({ createdAt: -1 })
    .populate("winners.userId", "name email")
    .lean();

  return NextResponse.json({ draws });
}
