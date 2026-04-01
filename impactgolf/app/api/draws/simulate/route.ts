import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";
import { simulateDraw } from "@/lib/drawEngine";

// POST /api/draws/simulate — admin only, dry run
export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { mode } = body as { mode?: "random" | "algorithmic" };

  try {
    const result = await simulateDraw(mode ?? "random");
    return NextResponse.json({ success: true, simulation: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
