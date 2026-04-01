import { NextResponse } from "next/server";
import { seedCharities } from "@/lib/seedCharities";

// GET /api/admin/seed — run once to populate charities
// No auth guard intentionally — seed is idempotent and only runs if DB is empty
export async function GET() {
  try {
    const result = await seedCharities();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[seed]", err);
    return NextResponse.json({ error: "Seed failed", message }, { status: 500 });
  }
}
