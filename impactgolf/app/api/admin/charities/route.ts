import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Charity } from "@/models";

// GET /api/admin/charities
export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const charities = await Charity.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ charities });
}

// POST /api/admin/charities — create new charity
export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const { name, description, logoUrl, website, featured } = body;

  if (!name || !description) {
    return NextResponse.json({ error: "name and description are required." }, { status: 400 });
  }

  const charity = await Charity.create({ name, description, logoUrl, website, featured: featured ?? false });
  return NextResponse.json({ charity }, { status: 201 });
}
