import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, Subscription } from "@/models";
import { requireAuth } from "@/lib/auth";

// TEST MODE ONLY — simulates a completed Stripe subscription
// Used because Stripe is invite-only in India
export async function POST(req: NextRequest) {
  const authUser = requireAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await req.json();
  const plan = body.plan === "annual" ? "annual" : "monthly";

  await connectDB();

  const now = new Date();
  const periodEnd = new Date(now);
  if (plan === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Update user subscription status
  await User.findByIdAndUpdate(authUser.userId, {
    subscriptionStatus: "active",
    subscriptionPlan: plan,
    subscriptionCurrentPeriodEnd: periodEnd,
    stripeCustomerId: "test_customer_" + authUser.userId,
    subscriptionId: "test_sub_" + authUser.userId,
  });

  // Create a subscription record
  await Subscription.findOneAndUpdate(
    { userId: authUser.userId },
    {
      userId: authUser.userId,
      stripeSubscriptionId: "test_sub_" + authUser.userId,
      stripeCustomerId: "test_customer_" + authUser.userId,
      plan,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      amountPence: plan === "annual" ? 15000 : 1500,
      currency: "gbp",
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({
    success: true,
    message: "Test subscription activated",
    plan,
    periodEnd,
  });
}
