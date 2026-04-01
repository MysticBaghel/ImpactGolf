import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Charity } from "@/models";

// GET /api/charities?search=&featured=true
// Public route — no auth required (charity directory is visible to all per PRD §03)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim();
    const featuredOnly = searchParams.get("featured") === "true";

    const query: Record<string, unknown> = { active: true };

    if (featuredOnly) query.featured = true;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const charities = await Charity.find(query)
      .select("name description logoUrl website featured totalRaised upcomingEvents")
      .sort({ featured: -1, totalRaised: -1 })
      .lean();

    return NextResponse.json({ charities });
  } catch (err) {
    console.error("[charities GET]", err);
    return NextResponse.json({ error: "Failed to fetch charities." }, { status: 500 });
  }
}
