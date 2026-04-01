import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { requireAuth } from "@/lib/auth";

// POST /api/stripe/portal
// Opens Stripe Customer Portal for managing/cancelling subscription
export async function POST(req: NextRequest) {
  const authUser = requireAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(authUser.userId).lean();
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
