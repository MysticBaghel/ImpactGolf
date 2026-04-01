"use client";
import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface DrawWinner {
  userId: string;
  matchType: "five" | "four" | "three";
  prizeAmountPence: number;
  verificationStatus: string;
}

interface Draw {
  _id: string;
  period: string;
  status: string;
  drawMode: string;
  drawnNumbers: number[];
  totalPoolPence: number;
  jackpotPoolPence: number;
  fourMatchPoolPence: number;
  threeMatchPoolPence: number;
  jackpotRolledOverPence: number;
  winners: DrawWinner[];
  eligibleSubscriberCount: number;
  runAt?: string;
  publishedAt?: string;
}

function penceToGBP(p: number) {
  return `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPeriod(p: string) {
  const [y, m] = p.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function winnersOfType(draw: Draw, type: "five" | "four" | "three") {
  return draw.winners.filter((w) => w.matchType === type);
}

// Animated number reveal
function RevealNumber({ n, delay }: { n: number; delay: number }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`w-16 h-20 md:w-24 md:h-32 flex items-center justify-center rounded-xl border transition-all duration-700 ${
      revealed
        ? "bg-surface-container-highest border-outline-variant/30"
        : "bg-surface-container-highest/30 backdrop-blur-lg border-outline-variant/10"
    }`}>
      <span className={`text-4xl md:text-6xl font-black font-headline transition-all duration-500 ${
        revealed ? "text-primary blur-none" : "text-on-surface-variant blur-md"
      }`}>
        {revealed ? String(n).padStart(2, "0") : "?"}
      </span>
    </div>
  );
}

export default function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [pending, setPending] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolledOver, setRolledOver] = useState(0);

  useEffect(() => {
    fetch("/api/draws")
      .then((r) => r.json())
      .then((data) => {
        if (data.draws) setDraws(data.draws);
        if (data.pending) setPending(data.pending);
        // Find most recent jackpot rollover
        const lastRollover = data.draws?.find((d: Draw) => d.jackpotRolledOverPence > 0);
        if (lastRollover) setRolledOver(lastRollover.jackpotRolledOverPence);
      })
      .finally(() => setLoading(false));
  }, []);

  const latestCompleted = draws[0];
  const historical = draws.slice(1);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">

        {/* ── JACKPOT ROLLOVER BANNER ── */}
        {rolledOver > 0 && (
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-secondary-container to-secondary p-[2px]">
              <div className="bg-surface-container-lowest rounded-[calc(0.5rem-2px)] py-4 px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    military_tech
                  </span>
                  <div>
                    <p className="text-secondary font-headline font-extrabold tracking-tight text-xl uppercase italic">
                      Jackpot Rollover
                    </p>
                    <p className="text-on-surface-variant text-sm">
                      No winner found last draw. The prize pool has escalated.
                    </p>
                  </div>
                </div>
                <span className="text-on-surface font-headline text-4xl font-black tracking-tighter">
                  {penceToGBP(rolledOver)}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── LIVE STATUS / LATEST DRAW ── */}
        {latestCompleted && (
          <section className="mb-20">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="font-headline font-extrabold text-4xl tracking-tighter">LIVE STATUS</h2>
              <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {pending ? "Draw in Progress" : "Latest Results"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Number reveal */}
              <div className="lg:col-span-2 bg-surface-container-low rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px] border-l-4 border-secondary shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(78,222,163,0.04),transparent_70%)]" />
                <p className="text-on-surface-variant font-headline font-bold text-sm tracking-widest uppercase mb-8 relative z-10">
                  {formatPeriod(latestCompleted.period)} — Winning Combination
                </p>
                <div className="flex flex-wrap justify-center gap-4 relative z-10">
                  {latestCompleted.drawnNumbers.map((n, i) => (
                    <RevealNumber key={n} n={n} delay={i * 400} />
                  ))}
                </div>
                <div className="mt-10 grid grid-cols-3 gap-6 w-full relative z-10">
                  {[
                    { label: "5 Match", count: winnersOfType(latestCompleted, "five").length, pool: latestCompleted.jackpotPoolPence, color: "text-secondary" },
                    { label: "4 Match", count: winnersOfType(latestCompleted, "four").length, pool: latestCompleted.fourMatchPoolPence, color: "text-primary" },
                    { label: "3 Match", count: winnersOfType(latestCompleted, "three").length, pool: latestCompleted.threeMatchPoolPence, color: "text-on-surface-variant" },
                  ].map(({ label, count, pool, color }) => (
                    <div key={label} className="text-center p-4 rounded-xl bg-surface-container-lowest">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
                      <p className={`text-xl font-black font-headline ${color}`}>{count}</p>
                      <p className="text-xs text-on-surface-variant">{penceToGBP(pool)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact context */}
              <div className="bg-primary-container/20 rounded-xl p-8 flex flex-col justify-between border border-primary/10">
                <div>
                  <span className="material-symbols-outlined text-primary text-5xl mb-6 block">volunteer_activism</span>
                  <h3 className="font-headline font-extrabold text-2xl tracking-tight leading-none mb-4">
                    Your Entry is Changing Lives.
                  </h3>
                  <p className="text-on-surface-variant text-lg leading-relaxed">
                    This draw supports our partner charities. Every subscription contributes{" "}
                    <span className="text-primary font-bold">25% directly to charity</span>.
                  </p>
                </div>
                <div className="pt-8">
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-container to-primary w-3/4 rounded-full" />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase">Charity Pool</span>
                    <span className="text-xs font-bold text-primary uppercase">
                      {penceToGBP(latestCompleted.totalPoolPence * 0.25)} this draw
                    </span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-outline-variant/15">
                    <p className="text-xs text-on-surface-variant mb-1">Eligible subscribers</p>
                    <p className="text-2xl font-black font-headline text-on-surface">
                      {latestCompleted.eligibleSubscriberCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── NO DRAWS YET ── */}
        {!loading && draws.length === 0 && (
          <section className="mb-20 text-center py-24">
            <span className="material-symbols-outlined text-primary/30 text-[6rem] block mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>
              military_tech
            </span>
            <h2 className="font-headline font-black text-3xl mb-4">No draws yet</h2>
            <p className="text-on-surface-variant mb-8">The first draw will appear here once it's run.</p>
            <Link href="/subscribe" className="inline-block px-8 py-4 bg-primary text-on-primary font-headline font-bold rounded-xl hover:scale-[1.02] transition-transform">
              Subscribe &amp; Get Entered
            </Link>
          </section>
        )}

        {/* ── HISTORICAL DRAWS ── */}
        {historical.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline font-extrabold text-3xl tracking-tighter uppercase">Historical Draws</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">calendar_today</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historical.map((draw) => {
                const fiveWinners = winnersOfType(draw, "five");
                const fourWinners = winnersOfType(draw, "four");
                const threeWinners = winnersOfType(draw, "three");
                const jackpotClaimed = fiveWinners.length > 0;

                return (
                  <div
                    key={draw._id}
                    className={`bg-surface-container-lowest rounded-xl p-6 border-l-4 group hover:bg-surface-container-low transition-all duration-300 ${
                      jackpotClaimed ? "border-secondary" : "border-primary/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">
                          {draw.runAt
                            ? new Date(draw.runAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                            : formatPeriod(draw.period)}
                        </p>
                        <h3 className="font-headline font-bold text-xl">{formatPeriod(draw.period)}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                        jackpotClaimed
                          ? "bg-secondary/10 text-secondary"
                          : draw.jackpotRolledOverPence > 0
                          ? "bg-error/10 text-error"
                          : "bg-surface-variant text-on-surface-variant"
                      }`}>
                        {jackpotClaimed ? "Jackpot Claimed" : draw.jackpotRolledOverPence > 0 ? "Rollover" : "Complete"}
                      </span>
                    </div>

                    {/* Drawn numbers */}
                    <div className="flex gap-2 mb-6">
                      {draw.drawnNumbers.map((n) => (
                        <span key={n} className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-sm font-bold text-on-surface">
                          {String(n).padStart(2, "0")}
                        </span>
                      ))}
                    </div>

                    {/* Results breakdown */}
                    <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">5 Matches</span>
                        {fiveWinners.length > 0
                          ? <span className="text-secondary font-bold">{fiveWinners.length} Winner{fiveWinners.length > 1 ? "s" : ""} ({penceToGBP(draw.jackpotPoolPence / fiveWinners.length)})</span>
                          : <span className="text-on-surface-variant italic">No Winner — Rolled Over</span>
                        }
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">4 Matches</span>
                        {fourWinners.length > 0
                          ? <span className="text-on-surface font-medium">{fourWinners.length} Winner{fourWinners.length > 1 ? "s" : ""} ({penceToGBP(draw.fourMatchPoolPence / fourWinners.length)})</span>
                          : <span className="text-on-surface-variant italic">No Winner</span>
                        }
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">3 Matches</span>
                        {threeWinners.length > 0
                          ? <span className="text-on-surface font-medium">{threeWinners.length} Winner{threeWinners.length > 1 ? "s" : ""} ({penceToGBP(draw.threeMatchPoolPence / threeWinners.length)})</span>
                          : <span className="text-on-surface-variant italic">No Winner</span>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── NO SUBSCRIPTION CTA ── */}
        <section className="mt-20">
          <div className="bg-surface-container-low rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-outline-variant/10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-xl mb-1">Want to enter the next draw?</h3>
                <p className="text-on-surface-variant text-sm">Subscribe and submit your last 5 scores to be entered automatically.</p>
              </div>
            </div>
            <Link href="/subscribe" className="whitespace-nowrap px-8 py-4 bg-primary text-on-primary font-headline font-extrabold rounded-xl hover:scale-[1.02] transition-transform">
              Join the Draw
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
