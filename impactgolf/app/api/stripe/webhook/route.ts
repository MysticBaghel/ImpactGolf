import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/mongodb";
import { User, Subscription } from "@/models";
import Stripe from "stripe";

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  await connectDB();

  const userId = sub.metadata?.userId;
  const plan = (sub.metadata?.plan as "monthly" | "annual") ?? "monthly";
  if (!userId) return;

  const status =
    sub.status === "active" ? "active"
    : sub.status === "past_due" ? "past_due"
    : sub.status === "canceled" ? "cancelled"
    : "inactive";

  const item = sub.items.data[0];
  const amountPence = item?.price?.unit_amount ?? 0;
  const currency = item?.price?.currency ?? "gbp";

  const subscriptionObj = sub as Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
  };

  const periodStart = new Date(subscriptionObj.current_period_start * 1000);
  const periodEnd = new Date(subscriptionObj.current_period_end * 1000);

  await User.findByIdAndUpdate(userId, {
    subscriptionStatus: status,
    subscriptionId: sub.id,
    subscriptionPlan: plan,
    subscriptionCurrentPeriodEnd: periodEnd,
    stripeCustomerId: sub.customer as string,
  });

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: sub.id },
    {
      userId,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: sub.customer as string,
      plan,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      amountPence,
      currency,
      cancelledAt: sub.canceled_at
        ? new Date(sub.canceled_at * 1000)
        : undefined,
    },
    { upsert: true, new: true }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;

        if (userId) {
          await connectDB();

          const subscriptionObj = sub as Stripe.Subscription & {
            current_period_end: number;
          };

          await User.findByIdAndUpdate(userId, {
            subscriptionStatus: "cancelled",
            subscriptionCurrentPeriodEnd: new Date(
              subscriptionObj.current_period_end * 1000
            ),
          });

          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: sub.id },
            { status: "cancelled", cancelledAt: new Date() }
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };

        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subId) {
          await connectDB();

          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subId },
            { status: "past_due" }
          );

          const sub = await Subscription.findOne({
            stripeSubscriptionId: subId,
          });

          if (sub) {
            await User.findByIdAndUpdate(sub.userId, {
              subscriptionStatus: "past_due",
            });
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}