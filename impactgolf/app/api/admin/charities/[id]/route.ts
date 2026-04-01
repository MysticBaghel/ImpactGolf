import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Charity } from "@/models";

// PATCH /api/admin/charities/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  await connectDB();

  const body = await req.json();
  const allowed = ["name", "description", "logoUrl", "website", "active", "featured"];
  const update: Record<string, unknown> = {};

  allowed.forEach((k) => {
    if (body[k] !== undefined) update[k] = body[k];
  });

  const charity = await Charity.findByIdAndUpdate(id, update, { new: true }).lean();

  if (!charity) {
    return NextResponse.json({ error: "Charity not found." }, { status: 404 });
  }

  return NextResponse.json({ charity });
}

// DELETE /api/admin/charities/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  await connectDB();

  await Charity.findByIdAndUpdate(id, { active: false });

  return NextResponse.json({ success: true });
}