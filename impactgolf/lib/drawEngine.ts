import { connectDB } from "./mongodb";
import { Draw, User, Score, Subscription, CharityContribution } from "@/models";
import mongoose from "mongoose";

// PRD §07 — fixed prize pool split
const SPLIT = {
  jackpot:    0.40,
  fourMatch:  0.35,
  threeMatch: 0.25,
};

// Subscription prices in pence
const PLAN_PRICE: Record<string, number> = {
  monthly: 1500,  // £15
  annual:  12500, // £150/12 = ~£12.50/month equivalent
};

// ── Generate 5 unique random numbers 1–45 (Stableford range) ──────────────
function randomDraw(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const drawn: number[] = [];
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return drawn.sort((a, b) => a - b);
}

// ── Algorithmic draw — weighted by most-frequent scores across all users ──
async function algorithmicDraw(): Promise<number[]> {
  const freq: Record<number, number> = {};
  const scores = await Score.find({}).select("score").lean();
  scores.forEach(({ score }) => { freq[score] = (freq[score] ?? 0) + 1; });

  // Build weighted pool
  const pool: number[] = [];
  for (let n = 1; n <= 45; n++) {
    const weight = freq[n] ?? 1;
    for (let w = 0; w < weight; w++) pool.push(n);
  }

  const drawn: number[] = [];
  const usedPool = [...pool];
  while (drawn.length < 5) {
    const idx = Math.floor(Math.random() * usedPool.length);
    const num = usedPool.splice(idx, 1)[0];
    if (!drawn.includes(num)) drawn.push(num);
  }
  return drawn.sort((a, b) => a - b);
}

// ── Count how many drawn numbers match a user's last 5 scores ────────────
function countMatches(userScores: number[], drawn: number[]): number {
  return userScores.filter((s) => drawn.includes(s)).length;
}

// ── Main draw engine ──────────────────────────────────────────────────────
export async function runDraw(period: string, mode: "random" | "algorithmic" = "random") {
  await connectDB();

  // Prevent duplicate draws for same period
  const existing = await Draw.findOne({ period });
  if (existing && existing.status === "completed") {
    throw new Error(`Draw for ${period} already completed.`);
  }

  // Get all active subscribers
  const activeUsers = await User.find({ subscriptionStatus: "active" })
    .select("_id subscriptionPlan charityId charityContributionPercent")
    .lean();

  const eligibleCount = activeUsers.length;

  // Calculate prize pool from all active subscriptions
  const totalPoolPence = activeUsers.reduce((sum, u) => {
    return sum + (PLAN_PRICE[u.subscriptionPlan ?? "monthly"] ?? 1500);
  }, 0);

  // Check for rolled-over jackpot from previous draw
  const lastDraw = await Draw.findOne({ status: "completed" })
    .sort({ createdAt: -1 })
    .lean();
  const rolledOver = lastDraw && lastDraw.jackpotRolledOverPence > 0
    ? lastDraw.jackpotRolledOverPence
    : 0;

  const jackpotPoolPence    = Math.round(totalPoolPence * SPLIT.jackpot) + rolledOver;
  const fourMatchPoolPence  = Math.round(totalPoolPence * SPLIT.fourMatch);
  const threeMatchPoolPence = Math.round(totalPoolPence * SPLIT.threeMatch);
  const charityPoolPence    = totalPoolPence - jackpotPoolPence - fourMatchPoolPence - threeMatchPoolPence + rolledOver;

  // Generate drawn numbers
  const drawnNumbers = mode === "algorithmic"
    ? await algorithmicDraw()
    : randomDraw();

  // Match all users' scores against drawn numbers
  const fiveMatches:  mongoose.Types.ObjectId[] = [];
  const fourMatches:  mongoose.Types.ObjectId[] = [];
  const threeMatches: mongoose.Types.ObjectId[] = [];

  for (const u of activeUsers) {
    const scores = await Score.find({ userId: u._id })
      .sort({ playedAt: -1 })
      .limit(5)
      .lean();
    const scoreValues = scores.map((s) => s.score);
    const matches = countMatches(scoreValues, drawnNumbers);
    if (matches >= 5) fiveMatches.push(u._id as mongoose.Types.ObjectId);
    else if (matches === 4) fourMatches.push(u._id as mongoose.Types.ObjectId);
    else if (matches === 3) threeMatches.push(u._id as mongoose.Types.ObjectId);
  }

  // Split prizes equally among winners in each tier
  const winners: {
    userId: mongoose.Types.ObjectId;
    matchType: "five" | "four" | "three";
    prizeAmountPence: number;
    verificationStatus: "pending";
  }[] = [];

  // 5-match jackpot — rolls over if no winner
  const jackpotRolledOverNext = fiveMatches.length === 0 ? jackpotPoolPence : 0;
  fiveMatches.forEach((uid) => winners.push({
    userId: uid,
    matchType: "five",
    prizeAmountPence: Math.floor(jackpotPoolPence / fiveMatches.length),
    verificationStatus: "pending",
  }));

  fourMatches.forEach((uid) => winners.push({
    userId: uid,
    matchType: "four",
    prizeAmountPence: fourMatches.length > 0
      ? Math.floor(fourMatchPoolPence / fourMatches.length)
      : 0,
    verificationStatus: "pending",
  }));

  threeMatches.forEach((uid) => winners.push({
    userId: uid,
    matchType: "three",
    prizeAmountPence: threeMatches.length > 0
      ? Math.floor(threeMatchPoolPence / threeMatches.length)
      : 0,
    verificationStatus: "pending",
  }));

  // Save draw record
  const draw = await Draw.findOneAndUpdate(
    { period },
    {
      period,
      status: "completed",
      drawMode: mode,
      totalPoolPence,
      jackpotPoolPence,
      fourMatchPoolPence,
      threeMatchPoolPence,
      charityPoolPence,
      jackpotRolledOverPence: jackpotRolledOverNext,
      drawnNumbers,
      winners,
      eligibleSubscriberCount: eligibleCount,
      runAt: new Date(),
      publishedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Create charity contribution records
  for (const u of activeUsers) {
    if (!u.charityId) continue;
    const subPrice = PLAN_PRICE[u.subscriptionPlan ?? "monthly"] ?? 1500;
    const contrib = Math.round(subPrice * (u.charityContributionPercent / 100));
    await CharityContribution.create({
      userId: u._id,
      charityId: u.charityId,
      drawId: draw._id,
      amountPence: contrib,
      contributionPercent: u.charityContributionPercent,
      status: "pending",
    });
  }

  return draw;
}

// ── Simulation mode — dry run, nothing saved ──────────────────────────────
export async function simulateDraw(mode: "random" | "algorithmic" = "random") {
  await connectDB();

  const drawnNumbers = mode === "algorithmic"
    ? await algorithmicDraw()
    : randomDraw();

  const activeUsers = await User.find({ subscriptionStatus: "active" })
    .select("_id subscriptionPlan")
    .lean();

  const totalPoolPence = activeUsers.reduce((sum, u) =>
    sum + (PLAN_PRICE[u.subscriptionPlan ?? "monthly"] ?? 1500), 0);

  let fiveCount = 0, fourCount = 0, threeCount = 0;
  for (const u of activeUsers) {
    const scores = await Score.find({ userId: u._id })
      .sort({ playedAt: -1 }).limit(5).lean();
    const matches = countMatches(scores.map((s) => s.score), drawnNumbers);
    if (matches >= 5) fiveCount++;
    else if (matches === 4) fourCount++;
    else if (matches === 3) threeCount++;
  }

  return {
    drawnNumbers,
    totalPoolPence,
    jackpotPoolPence:    Math.round(totalPoolPence * SPLIT.jackpot),
    fourMatchPoolPence:  Math.round(totalPoolPence * SPLIT.fourMatch),
    threeMatchPoolPence: Math.round(totalPoolPence * SPLIT.threeMatch),
    eligibleCount: activeUsers.length,
    fiveMatchWinners:  fiveCount,
    fourMatchWinners:  fourCount,
    threeMatchWinners: threeCount,
    jackpotWon: fiveCount > 0,
  };
}
