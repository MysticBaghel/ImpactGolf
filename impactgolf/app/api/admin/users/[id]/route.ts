import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";

// PATCH /api/admin/users/[id] — edit user (role, subscriptionStatus)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await context.params;

  await connectDB();
  const body = await req.json();
  const allowed = ["role", "subscriptionStatus", "subscriptionPlan", "name"];
  const update: Record<string, unknown> = {};
  allowed.forEach((k) => { if (body[k] !== undefined) update[k] = body[k]; });

  const user = await User.findByIdAndUpdate(id, update, { new: true })
    .select("-passwordHash")
    .lean();

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ user });
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await context.params;

  await connectDB();
  await User.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
