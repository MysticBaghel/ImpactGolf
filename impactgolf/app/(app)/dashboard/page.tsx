"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Score {
  _id: string;
  score: number;
  playedAt: string;
}

interface CharityData {
  charityId: { _id: string; name: string; description: string; logoUrl?: string; totalRaised: number } | null;
  charityContributionPercent: number;
}

function penceToGBP(p: number) {
  return `£${(p / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

function getLocalDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const { user, loading, logout, getToken, refreshUser } = useAuth();
  const router = useRouter();

  const [scores, setScores] = useState<Score[]>([]);
  const [scoreInput, setScoreInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [scoreSuccess, setScoreSuccess] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [charity, setCharity] = useState<CharityData | null>(null);
  const [pctInput, setPctInput] = useState(10);
  const [savingCharity, setSavingCharity] = useState(false);
  const [charityMsg, setCharityMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    setDateInput(getLocalDateString());
  }, []);

  useEffect(() => {
    if (user) {
      fetchScores();
      fetchCharity();
    }
  }, [user]);

  async function fetchScores() {
    const res = await fetch("/api/scores", { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.scores) setScores(data.scores);
  }

  async function fetchCharity() {
    const res = await fetch("/api/user/charity", { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    setCharity(data);
    if (data.charityContributionPercent) setPctInput(data.charityContributionPercent);
  }

  async function handleAddScore(e: React.FormEvent) {
    e.preventDefault();
    setScoreError(""); setScoreSuccess("");
    const val = parseInt(scoreInput);
    if (isNaN(val) || val < 1 || val > 45) { setScoreError("Score must be between 1 and 45"); return; }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (new Date(dateInput) > today) { setScoreError("Date cannot be in the future."); return; }

    setSubmitting(true);
    if (scores.length >= 5) {
      const oldest = [...scores].sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime())[0];
      setRemovingId(oldest._id);
      await new Promise((r) => setTimeout(r, 500));
    }

    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ score: val, playedAt: dateInput }),
    });
    const data = await res.json();
    setSubmitting(false); setRemovingId(null);
    if (!res.ok) { setScoreError(data.error || "Failed to add score"); return; }
    setScores(data.scores);
    setScoreInput("");
    setScoreSuccess("Score added!");
    setTimeout(() => setScoreSuccess(""), 3000);
  }

  async function handleSaveCharity() {
    setSavingCharity(true); setCharityMsg("");
    const res = await fetch("/api/user/charity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ charityContributionPercent: pctInput }),
    });
    setSavingCharity(false);
    if (res.ok) {
      await fetchCharity();
      refreshUser();
      setCharityMsg("Contribution updated!");
      setTimeout(() => setCharityMsg(""), 3000);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  const isSubscribed = user.subscriptionStatus === "active";
  const avg = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;
  const best = scores.length ? Math.max(...scores.map((s) => s.score)) : 0;
  const todayStr = getLocalDateString();

  return (
    <div className="min-h-screen bg-surface-dim font-body">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex h-full w-64 flex-col border-r border-outline-variant/15 fixed left-0 top-0 bg-surface-container-lowest z-40">
        <div className="p-8">
          <Link href="/" className="text-xl font-bold text-primary font-headline tracking-tighter">ImpactGolf</Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {[
            { href: "/dashboard", icon: "dashboard", label: "Dashboard", active: true },
            { href: "/draws", icon: "military_tech", label: "Active Draws" },
            { href: "/charities", icon: "favorite", label: "Charities" },
            { href: "/subscribe", icon: "settings", label: "Subscription" },
          ].map(({ href, icon, label, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-headline text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-container/10 text-primary border-r-4 border-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-outline-variant/15">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-headline font-black text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold font-headline truncate max-w-[120px]">{user.name}</p>
              <p className="text-xs text-on-surface-variant">{isSubscribed ? "Pro Subscriber" : "No Plan"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 px-4 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-bold hover:bg-surface-container-low transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/60 backdrop-blur-xl md:hidden">
        <div className="flex justify-between items-center px-6 py-4">
          <Link href="/" className="text-2xl font-black tracking-tighter text-primary font-headline">ImpactGolf</Link>
          <button onClick={logout} className="text-on-surface-variant">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="md:ml-64 pt-20 pb-32 md:pt-12 md:pb-12 px-6 lg:px-12">

        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tight mb-2">Dashboard</h1>
            <p className="text-on-surface-variant font-medium">Welcome back, {user.name.split(" ")[0]}. Your impact is growing.</p>
          </div>
          <span className={`self-start px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border ${
            isSubscribed ? "bg-primary/10 text-primary border-primary/20" : "bg-white/5 text-white/40 border-white/10"
          }`}>
            {isSubscribed ? `${user.subscriptionPlan ?? "Pro"} Subscriber` : "No Subscription"}
          </span>
        </header>

        {/* Subscription gate */}
        {!isSubscribed && (
          <div className="mb-10 p-8 rounded-3xl bg-surface-container-low border border-outline-variant/10 text-center">
            <span className="material-symbols-outlined text-primary text-5xl block mb-4">lock</span>
            <h2 className="font-headline font-bold text-xl mb-2">Subscribe to unlock all features</h2>
            <p className="text-on-surface-variant text-sm mb-6">Enter scores, join draws, and support your chosen charity.</p>
            <Link href="/subscribe" className="inline-block px-8 py-3 bg-primary text-on-primary font-headline font-bold rounded-xl hover:scale-[1.02] transition-transform">
              View Plans
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── LEFT: Scores + Stats ── */}
          <section className="lg:col-span-8 space-y-6">

            {charity?.charityId && (
              <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <span className="material-symbols-outlined text-[8rem]" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                </div>
                <div className="relative z-10">
                  <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-4">Your Charity Impact</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black font-headline text-primary">
                      {penceToGBP(charity.charityId.totalRaised)}
                    </span>
                    <span className="text-on-surface-variant font-medium">raised together</span>
                  </div>
                  <p className="text-on-surface-variant text-sm mb-6">{charity.charityId.name}</p>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full w-[75%]" />
                  </div>
                </div>
              </div>
            )}

            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold font-headline">Score Management</h3>
                  <p className="text-sm text-on-surface-variant">Last 5 Stableford scores · newest replaces oldest</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-error/10 text-error border border-error/20 text-[10px] font-bold uppercase">
                  <span className="material-symbols-outlined text-sm">history</span>
                  Replace Oldest
                </div>
              </div>

              {scores.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                  {scores.map((s, i) => {
                    const isOldest = scores.length >= 5 &&
                      s._id === [...scores].sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime())[0]._id;
                    const isLatest = i === 0;
                    return (
                      <div
                        key={s._id}
                        className={`p-4 rounded-2xl border transition-all duration-500 ${
                          removingId === s._id
                            ? "opacity-0 scale-95 border-error/40 bg-error/10"
                            : isOldest && scores.length >= 5
                            ? "border-error/40 bg-surface-container-low"
                            : isLatest
                            ? "border-primary/30 bg-surface-container-high"
                            : "border-outline-variant/15 bg-surface-container-low"
                        }`}
                      >
                        <label className={`block text-[10px] uppercase font-bold mb-2 ${
                          isOldest && scores.length >= 5 ? "text-error" : isLatest ? "text-primary" : "text-on-surface-variant"
                        }`}>
                          {isOldest && scores.length >= 5 ? "Oldest" : isLatest ? "Latest" : `Score #${i + 1}`}
                        </label>
                        <p className={`text-3xl font-black font-headline ${
                          isOldest && scores.length >= 5 ? "text-error" : isLatest ? "text-primary" : "text-on-surface"
                        }`}>{s.score}</p>
                        <p className="text-[10px] text-on-surface-variant mt-2">
                          {new Date(s.playedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm text-center py-8 mb-8">No scores yet — add your first below</p>
              )}

              {isSubscribed ? (
                <form onSubmit={handleAddScore} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="number" min={1} max={45}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    placeholder="Score (1–45)"
                    className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <input
                    type="date"
                    value={dateInput}
                    max={todayStr}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    type="submit" disabled={submitting}
                    className="px-8 py-3 bg-primary text-on-primary font-headline font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {submitting ? "Adding…" : "Add Score"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4 text-on-surface-variant text-sm">
                  <Link href="/subscribe" className="text-primary font-bold hover:underline">Subscribe</Link> to enter scores
                </div>
              )}

              {scoreError && <p className="mt-3 text-error text-sm">{scoreError}</p>}
              {scoreSuccess && <p className="mt-3 text-primary text-sm">{scoreSuccess}</p>}
            </div>

            {scores.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Best", value: best },
                  { label: "Average", value: avg },
                  { label: "Entered", value: `${scores.length}/5` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-container-low rounded-2xl p-5 text-center border border-outline-variant/10">
                    <div className="text-2xl font-headline font-black text-primary mb-1">{value}</div>
                    <div className="text-xs text-on-surface-variant uppercase tracking-widest">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── RIGHT: Sidebar panels ── */}
          <section className="lg:col-span-4 space-y-6">

            <div className="p-6 rounded-3xl bg-surface-container border border-outline-variant/10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold font-headline">Upcoming Draw</h3>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {isSubscribed ? "Entry Confirmed" : "Not Entered"}
                </span>
              </div>
              <div className="text-center py-6 border-y border-outline-variant/15 mb-6">
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-3">Time Remaining</p>
                <div className="flex justify-center gap-3">
                  {[["04", "Days"], ["18", "Hrs"], ["32", "Min"]].map(([val, unit]) => (
                    <div key={unit} className="flex flex-col items-center">
                      <span className="text-3xl font-black font-headline">{val}</span>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase">{unit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-2xl">military_tech</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Prize Pot</p>
                  <p className="font-black font-headline text-sm">£5,000 Luxury Golf Tour</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/10">
              <h3 className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-4">Your Charity</h3>
              {charity?.charityId ? (
                <div className="mb-4">
                  <p className="font-headline font-bold text-on-surface mb-1">{charity.charityId.name}</p>
                  <p className="text-xs text-on-surface-variant line-clamp-2">{charity.charityId.description}</p>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant mb-4">No charity selected yet.</p>
              )}

              <div className="mb-4">
                <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  <span>Contribution</span>
                  <span className="text-primary">{pctInput}%</span>
                </div>
                <input
                  type="range" min={10} max={100} step={5}
                  value={pctInput}
                  onChange={(e) => setPctInput(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                  <span>Min 10%</span><span>Max 100%</span>
                </div>
              </div>

              <button
                onClick={handleSaveCharity}
                disabled={savingCharity}
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:scale-[1.01] transition-transform disabled:opacity-50 mb-3"
              >
                {savingCharity ? "Saving…" : "Save Contribution"}
              </button>
              {charityMsg && <p className="text-primary text-xs text-center">{charityMsg}</p>}

              <Link
                href="/charities"
                className="w-full py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">search</span>
                Browse Charities
              </Link>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/10 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <span className="material-symbols-outlined text-9xl">payments</span>
              </div>
              <h3 className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-4">Winnings</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-black font-headline">£0.00</span>
                <span className="px-3 py-1 rounded-full bg-outline-variant/20 text-on-surface-variant text-[10px] font-bold uppercase">No wins yet</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">Enter draws to win prizes.</p>
            </div>
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-surface-dim/80 backdrop-blur-2xl z-50 md:hidden rounded-t-3xl border-t border-outline-variant/10">
        {[
          { href: "/dashboard", icon: "home", label: "Home", active: true },
          { href: "/draws", icon: "golf_course", label: "Draws" },
          { href: "/charities", icon: "volunteer_activism", label: "Impact" },
          { href: "/dashboard", icon: "person", label: "Profile" },
        ].map(({ href, icon, label, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-all ${
              active ? "bg-primary/20 text-primary" : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] uppercase tracking-widest mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
