import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { requireAuth } from "@/lib/auth";

// GET /api/auth/me — returns the authenticated user's profile
export async function GET(req: NextRequest) {
  const authUser = requireAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  try {
    await connectDB();

    const user = await User.findById(authUser.userId)
      .select("-passwordHash")
      .populate("charityId", "name logoUrl")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[me]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
