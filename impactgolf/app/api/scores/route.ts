import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Score, User } from "@/models";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });

  await connectDB();

  const scores = await Score.find({ userId: payload.userId })
    .sort({ playedAt: -1 })
    .limit(5)
    .lean();

  return NextResponse.json({ scores });
}

export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });

  const body = await req.json();
  const { score, playedAt } = body;

  if (!score || !playedAt) {
    return NextResponse.json({ error: "score and playedAt are required" }, { status: 400 });
  }
  if (typeof score !== "number" || score < 1 || score > 45) {
    return NextResponse.json({ error: "Score must be between 1 and 45" }, { status: 400 });
  }

  // Reject future dates
  const playedDate = new Date(playedAt);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // allow today
  if (playedDate > today) {
    return NextResponse.json({ error: "Score date cannot be in the future" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(payload.userId).lean();
  if (!user || user.subscriptionStatus !== "active") {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  // Rolling 5-score logic — delete oldest by playedAt, then createdAt as tiebreaker
  const existing = await Score.find({ userId: payload.userId })
    .sort({ playedAt: 1, createdAt: 1 });

  if (existing.length >= 5) {
    await Score.findByIdAndDelete(existing[0]._id);
  }

  const newScore = await Score.create({
    userId: payload.userId,
    score,
    playedAt: playedDate,
  });

  const scores = await Score.find({ userId: payload.userId })
    .sort({ playedAt: -1 })
    .limit(5)
    .lean();

  return NextResponse.json({ score: newScore, scores }, { status: 201 });
}
