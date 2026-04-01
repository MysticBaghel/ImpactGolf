import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Draw, User } from "@/models";

// PATCH /api/admin/draws/[id]/winners/[winnerId]
// Verify winner — approve/reject + mark paid
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; winnerId: string }> }
) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id, winnerId } = await context.params;

  const body = await req.json();
  const { verificationStatus, paidAt } = body as {
    verificationStatus?: "approved" | "rejected";
    paidAt?: string;
  };

  await connectDB();

  const draw = await Draw.findById(id);
  if (!draw) return NextResponse.json({ error: "Draw not found." }, { status: 404 });

  // Find winner by userId (winnerId param is the userId)
  const winner = draw.winners.find(
    (w) => w.userId.toString() === winnerId
  );
  if (!winner) return NextResponse.json({ error: "Winner not found." }, { status: 404 });

  if (verificationStatus) winner.verificationStatus = verificationStatus;
  if (paidAt) winner.paidAt = new Date(paidAt);

  // Track who verified
  draw.verifiedBy = payload.userId as never;
  await draw.save();

  return NextResponse.json({ success: true, draw });
}
