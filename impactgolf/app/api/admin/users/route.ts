import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User, Score } from "@/models";

// GET /api/admin/users?page=1&search=
export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = 20;
  const search = searchParams.get("search")?.trim();

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .populate("charityId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Attach score count to each user
  const usersWithScores = await Promise.all(
    users.map(async (u) => {
      const scoreCount = await Score.countDocuments({ userId: u._id });
      return { ...u, scoreCount };
    })
  );

  return NextResponse.json({ users: usersWithScores, total, page, pages: Math.ceil(total / limit) });
}
