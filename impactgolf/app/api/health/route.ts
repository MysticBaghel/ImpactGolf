import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
// importing models registers them with mongoose
import "@/models";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      status: "ok",
      db: "connected",
      models: ["User", "Score", "Charity", "Draw", "Subscription", "CharityContribution"],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", db: "disconnected", message }, { status: 500 });
  }
}
