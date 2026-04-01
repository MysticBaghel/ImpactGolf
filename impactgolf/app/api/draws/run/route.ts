import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { runDraw } from "@/lib/drawEngine";

// POST /api/draws/run — admin only
export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await req.json();
  const { period, mode } = body as { period?: string; mode?: "random" | "algorithmic" };

  // Default to current month if no period supplied
  const now = new Date();
  const drawPeriod = period ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  try {
    const draw = await runDraw(drawPeriod, mode ?? "random");
    return NextResponse.json({ success: true, draw });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Draw failed.";
    console.error("[draws/run]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
