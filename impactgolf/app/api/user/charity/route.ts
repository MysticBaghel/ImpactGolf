import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, Charity } from "@/models";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

// GET /api/user/charity — get current user's charity selection
export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token." }, { status: 401 });

  await connectDB();
  const user = await User.findById(payload.userId)
    .select("charityId charityContributionPercent")
    .populate("charityId", "name description logoUrl totalRaised")
    .lean();

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json({
    charityId: user.charityId,
    charityContributionPercent: user.charityContributionPercent,
  });
}

// PATCH /api/user/charity — update charity selection + contribution %
export async function PATCH(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token." }, { status: 401 });

  const body = await req.json();
  const { charityId, charityContributionPercent } = body;

  // Validate percent if provided
  if (
    charityContributionPercent !== undefined &&
    (typeof charityContributionPercent !== "number" ||
      charityContributionPercent < 10 ||
      charityContributionPercent > 100)
  ) {
    return NextResponse.json(
      { error: "charityContributionPercent must be between 10 and 100." },
      { status: 400 }
    );
  }

  await connectDB();

  // Verify charity exists and is active
  if (charityId) {
    const charity = await Charity.findOne({ _id: charityId, active: true }).lean();
    if (!charity) {
      return NextResponse.json({ error: "Charity not found or inactive." }, { status: 404 });
    }
  }

  const update: Record<string, unknown> = {};
  if (charityId !== undefined) update.charityId = charityId;
  if (charityContributionPercent !== undefined) update.charityContributionPercent = charityContributionPercent;

  const user = await User.findByIdAndUpdate(payload.userId, update, { new: true })
    .select("-passwordHash")
    .populate("charityId", "name description logoUrl totalRaised")
    .lean();

  return NextResponse.json({ user });
}
