import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

// Stripe's public test price IDs — work with any test mode key
export const STRIPE_PRICES = {
  monthly: "price_1OqmCvSFPJuPHFxGqDvhKjfL",
  annual:  "price_1OqmCvSFPJuPHFxGqDvhKjfL",
};

// PRD §07 — fixed subscription split
export const SUBSCRIPTION_SPLIT = {
  platformPercent: 40,
  prizePoolPercent: 35,
  charityPercent: 25,
};
