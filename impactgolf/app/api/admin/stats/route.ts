import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User, Draw, Charity, CharityContribution } from "@/models";

// GET /api/admin/stats — platform overview numbers
export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  await connectDB();

  const [
    totalUsers,
    activeUsers,
    totalCharities,
    draws,
    totalContribPence,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ subscriptionStatus: "active" }),
    Charity.countDocuments({ active: true }),
    Draw.find({ status: "completed" }).select("totalPoolPence jackpotPoolPence charityPoolPence winners").lean(),
    CharityContribution.aggregate([{ $group: { _id: null, total: { $sum: "$amountPence" } } }]),
  ]);

  const totalPrizePoolPence = draws.reduce((s, d) => s + d.totalPoolPence, 0);
  const totalCharityPence   = totalContribPence[0]?.total ?? 0;
  const pendingWinners      = draws.flatMap((d) => d.winners).filter((w) => w.verificationStatus === "pending").length;

  return NextResponse.json({
    totalUsers,
    activeUsers,
    totalCharities,
    totalDraws: draws.length,
    totalPrizePoolPence,
    totalCharityPence,
    pendingWinners,
  });
}
