import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { requireAuth } from "@/lib/auth";

// POST /api/stripe/checkout
// Creates a Stripe Checkout session and returns the URL
export async function POST(req: NextRequest) {
  const authUser = requireAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await req.json();
  const { plan } = body as { plan: "monthly" | "annual" };

  if (!plan || !["monthly", "annual"].includes(plan)) {
    return NextResponse.json({ error: "plan must be 'monthly' or 'annual'." }, { status: 400 });
  }

  const priceId = STRIPE_PRICES[plan];
  if (!priceId) {
    return NextResponse.json({ error: `Stripe price ID for '${plan}' is not configured.` }, { status: 500 });
  }

  await connectDB();
  const user = await User.findById(authUser.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Reuse existing Stripe customer or create new one
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/subscribe`,
    metadata: { userId: user._id.toString(), plan },
    subscription_data: {
      metadata: { userId: user._id.toString(), plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
