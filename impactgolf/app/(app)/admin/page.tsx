"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalCharities: number;
  totalDraws: number;
  totalPrizePoolPence: number;
  totalCharityPence: number;
  pendingWinners: number;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  scoreCount: number;
  charityId?: { name: string } | null;
  createdAt: string;
}

interface DrawWinner {
  userId: string | { _id: string; name: string; email: string };
  matchType: "five" | "four" | "three";
  prizeAmountPence: number;
  verificationStatus: string;
  paidAt?: string;
}

interface AdminDraw {
  _id: string;
  period: string;
  status: string;
  drawMode: string;
  drawnNumbers: number[];
  totalPoolPence: number;
  jackpotPoolPence: number;
  fourMatchPoolPence: number;
  threeMatchPoolPence: number;
  winners: DrawWinner[];
  eligibleSubscriberCount: number;
  runAt?: string;
}

interface AdminCharity {
  _id: string;
  name: string;
  description: string;
  active: boolean;
  featured: boolean;
  totalRaised: number;
  website?: string;
  imageUrl?: string;
}

type Tab = "overview" | "users" | "draws" | "charities" | "winners";

// ── Helpers ────────────────────────────────────────────────────────────────
function gbp(p: number) {
  return `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
}

function formatPeriod(p: string) {
  const [y, m] = p.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    active:    "bg-primary/10 text-primary",
    inactive:  "bg-surface-variant text-on-surface-variant",
    cancelled: "bg-error/10 text-error",
    past_due:  "bg-secondary/10 text-secondary",
  };
  return map[s] ?? "bg-surface-variant text-on-surface-variant";
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  // Data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userPages, setUserPages] = useState(1);
  const [draws, setDraws] = useState<AdminDraw[]>([]);
  const [charities, setCharities] = useState<AdminCharity[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Draw controls
  const [drawMode, setDrawMode] = useState<"random" | "algorithmic">("random");
  const [drawPeriod, setDrawPeriod] = useState("");
  const [drawRunning, setDrawRunning] = useState(false);
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);
  const [drawMsg, setDrawMsg] = useState("");

  // New charity form
  const [newCharity, setNewCharity] = useState({ name: "", description: "", website: "", imageUrl: "" });
  const [addingCharity, setAddingCharity] = useState(false);
  const [charityMsg, setCharityMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "admin") { router.push("/dashboard"); }
  }, [user, loading, router]);

  useEffect(() => {
    const n = new Date();
    setDrawPeriod(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (tab === "users") fetchUsers();
    if (tab === "draws" || tab === "winners") fetchDraws();
    if (tab === "charities") fetchCharities();
  }, [tab]);

  useEffect(() => {
    if (tab === "users") fetchUsers();
  }, [userPage, userSearch]);

  async function api(path: string, opts?: RequestInit) {
    return fetch(path, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) },
    });
  }

  async function fetchStats() {
    const res = await api("/api/admin/stats");
    const data = await res.json();
    if (data) setStats(data);
  }

  async function fetchUsers() {
    setDataLoading(true);
    const params = new URLSearchParams({ page: String(userPage), ...(userSearch ? { search: userSearch } : {}) });
    const res = await api(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setUserTotal(data.total ?? 0);
    setUserPages(data.pages ?? 1);
    setDataLoading(false);
  }

  async function fetchDraws() {
    setDataLoading(true);
    const res = await api("/api/admin/draws");
    const data = await res.json();
    setDraws(data.draws ?? []);
    setDataLoading(false);
  }

  async function fetchCharities() {
    setDataLoading(true);
    const res = await api("/api/admin/charities");
    const data = await res.json();
    setCharities(data.charities ?? []);
    setDataLoading(false);
  }

  async function handleRunDraw() {
    if (!confirm(`Run ${drawMode} draw for ${drawPeriod}? This cannot be undone.`)) return;
    setDrawRunning(true); setDrawMsg("");
    const res = await api("/api/draws/run", {
      method: "POST",
      body: JSON.stringify({ period: drawPeriod, mode: drawMode }),
    });
    const data = await res.json();
    setDrawRunning(false);
    setDrawMsg(res.ok ? `✓ Draw completed for ${drawPeriod}` : `✗ ${data.error}`);
    if (res.ok) { fetchStats(); fetchDraws(); }
  }

  async function handleSimulate() {
    setDrawRunning(true); setSimResult(null); setDrawMsg("");
    const res = await api("/api/draws/simulate", {
      method: "POST",
      body: JSON.stringify({ mode: drawMode }),
    });
    const data = await res.json();
    setDrawRunning(false);
    if (res.ok) setSimResult(data.simulation);
    else setDrawMsg(`✗ ${data.error}`);
  }

  async function handleVerifyWinner(drawId: string, userId: string, status: "approved" | "rejected") {
    await api(`/api/admin/draws/${drawId}/winners/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ verificationStatus: status, ...(status === "approved" ? { paidAt: new Date().toISOString() } : {}) }),
    });
    fetchDraws();
    fetchStats();
  }

  async function handleToggleCharity(id: string, active: boolean) {
    await api(`/api/admin/charities/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
    fetchCharities();
  }

  async function handleToggleFeatured(id: string, featured: boolean) {
    await api(`/api/admin/charities/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ featured }),
    });
    fetchCharities();
  }

  async function handleAddCharity() {
    if (!newCharity.name || !newCharity.description) return;
    setAddingCharity(true); setCharityMsg("");
    const res = await api("/api/admin/charities", {
      method: "POST",
      body: JSON.stringify(newCharity),
    });
    setAddingCharity(false);
    if (res.ok) {
      setNewCharity({ name: "", description: "", website: "", imageUrl: "" });
      setCharityMsg("✓ Charity added");
      fetchCharities();
    } else {
      const d = await res.json();
      setCharityMsg(`✗ ${d.error}`);
    }
    setTimeout(() => setCharityMsg(""), 3000);
  }

  async function handleUserStatusChange(id: string, subscriptionStatus: string) {
    await api(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ subscriptionStatus }),
    });
    fetchUsers();
    fetchStats();
  }

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (user.role !== "admin") return null;

  // All winners across all draws
  const allWinners = draws.flatMap((d) =>
    d.winners.map((w) => ({ ...w, draw: d }))
  );
  const pendingWinners = allWinners.filter((w) => w.verificationStatus === "pending");

  const NAV_ITEMS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "overview",  icon: "dashboard",          label: "Dashboard" },
    { id: "users",     icon: "group",               label: "Users",        badge: stats?.totalUsers },
    { id: "draws",     icon: "military_tech",       label: "Draw Management" },
    { id: "charities", icon: "volunteer_activism",  label: "Charities",    badge: stats?.totalCharities },
    { id: "winners",   icon: "emoji_events",        label: "Winners",      badge: stats?.pendingWinners },
  ];

  return (
    <div className="flex min-h-screen bg-surface-container-lowest text-on-surface font-body">

      {/* ── SIDEBAR ── */}
      <aside className="fixed left-0 top-0 h-screen z-40 bg-surface-container-lowest w-64 hidden md:flex flex-col border-r border-outline-variant/15">
        <div className="p-6">
          <Link href="/" className="text-xl font-bold text-primary tracking-tighter font-headline">ImpactGolf</Link>
          <div className="mt-6 flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black font-headline">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-on-surface font-bold text-xs uppercase tracking-wider">{user.name}</p>
              <p className="text-on-surface-variant text-[10px]">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {NAV_ITEMS.map(({ id, icon, label, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-medium font-headline ${
                tab === id
                  ? "bg-primary/10 text-primary border-r-4 border-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">{icon}</span>
                <span>{label}</span>
              </div>
              {badge !== undefined && badge > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  id === "winners" && badge > 0 ? "bg-error/20 text-error" : "bg-primary/10 text-primary"
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-outline-variant/15">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary transition-colors text-sm">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex justify-between items-center px-8 py-5 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/10">
          <div>
            <h1 className="font-headline font-extrabold text-2xl tracking-tight uppercase">Admin Dashboard</h1>
            <p className="text-on-surface-variant text-sm mt-0.5">Platform overview and management.</p>
          </div>
          <div className="flex items-center gap-3">
            {(stats?.pendingWinners ?? 0) > 0 && (
              <button onClick={() => setTab("winners")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-error/10 border border-error/20 text-error text-xs font-bold">
                <span className="material-symbols-outlined text-sm">notifications</span>
                {stats?.pendingWinners} pending
              </button>
            )}
          </div>
        </header>

        <div className="px-8 py-10 max-w-[1400px] mx-auto space-y-10">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              {/* Stats bento */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Total Users",       value: stats?.totalUsers ?? "—",       icon: "group",              color: "text-primary",   border: "" },
                  { label: "Active Subscribers",value: stats?.activeUsers ?? "—",      icon: "subscriptions",      color: "text-secondary", border: "" },
                  { label: "Total Charity Impact", value: stats ? gbp(stats.totalCharityPence) : "—", icon: "volunteer_activism", color: "text-primary", border: "border-l-4 border-primary" },
                  { label: "Prize Pool Paid",   value: stats ? gbp(stats.totalPrizePoolPence) : "—", icon: "payments",    color: "text-secondary", border: "" },
                  { label: "Draws Run",         value: stats?.totalDraws ?? "—",       icon: "military_tech",      color: "text-primary",   border: "" },
                  { label: "Pending Payouts",   value: stats?.pendingWinners ?? "—",   icon: "pending_actions",    color: "text-error",     border: (stats?.pendingWinners ?? 0) > 0 ? "border-l-4 border-error" : "" },
                ].map(({ label, value, icon, color, border }) => (
                  <div key={label} className={`bg-surface-container-low p-8 rounded-2xl relative overflow-hidden ${border}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{label}</p>
                        <h3 className="font-headline text-4xl font-black mt-2 text-on-surface">{value}</h3>
                      </div>
                      <span className={`material-symbols-outlined text-3xl ${color}`}>{icon}</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                      <span className="material-symbols-outlined text-9xl">{icon}</span>
                    </div>
                  </div>
                ))}
              </section>

              {/* Quick actions */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Manage Users",    tab: "users" as Tab,     icon: "group" },
                  { label: "Run Draw",        tab: "draws" as Tab,     icon: "military_tech" },
                  { label: "Verify Winners",  tab: "winners" as Tab,   icon: "emoji_events" },
                ].map(({ label, tab: t, icon }) => (
                  <button
                    key={label}
                    onClick={() => setTab(t)}
                    className="flex items-center gap-4 p-6 rounded-2xl bg-surface-container border border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">{icon}</span>
                    </div>
                    <span className="font-headline font-bold">{label}</span>
                    <span className="material-symbols-outlined text-on-surface-variant ml-auto">arrow_forward</span>
                  </button>
                ))}
              </section>
            </>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <section>
              <div className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="font-headline font-bold text-xl">User Management</h2>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                      <input
                        value={userSearch}
                        onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                        placeholder="Search users..."
                        className="w-full bg-surface-container-lowest pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-outline-variant/20 focus:border-primary/40 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                      <tr>
                        {["User", "Status", "Plan", "Scores", "Charity", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-label">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {dataLoading ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">Loading…</td></tr>
                      ) : users.map((u) => (
                        <tr key={u._id} className="hover:bg-surface-container-high/30 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm font-headline">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold">{u.name}</p>
                                <p className="text-xs text-on-surface-variant">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadge(u.subscriptionStatus)}`}>
                              {u.subscriptionStatus}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface-variant capitalize">{u.subscriptionPlan ?? "—"}</td>
                          <td className="px-6 py-5 text-center font-headline font-black text-sm text-primary">{u.scoreCount}</td>
                          <td className="px-6 py-5">
                            <span className="text-xs border border-outline-variant/20 rounded px-2 py-1 text-on-surface">
                              {u.charityId?.name ?? "None"}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <select
                              value={u.subscriptionStatus}
                              onChange={(e) => handleUserStatusChange(u._id, e.target.value)}
                              className="bg-surface-container-highest text-xs text-on-surface border border-outline-variant/20 rounded-lg px-2 py-1.5 outline-none"
                            >
                              <option value="active">active</option>
                              <option value="inactive">inactive</option>
                              <option value="cancelled">cancelled</option>
                              <option value="past_due">past_due</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 bg-surface-container-low border-t border-outline-variant/5 flex justify-between items-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  <span>Showing {users.length} of {userTotal}</span>
                  <div className="flex gap-3">
                    <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage === 1} className="hover:text-primary disabled:opacity-30">Previous</button>
                    <span className="text-on-surface">{userPage} / {userPages}</span>
                    <button onClick={() => setUserPage((p) => Math.min(userPages, p + 1))} disabled={userPage === userPages} className="hover:text-primary disabled:opacity-30">Next</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── DRAWS ── */}
          {tab === "draws" && (
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Controls */}
              <div className="xl:col-span-1 space-y-6">
                <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10">
                  <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">settings_suggest</span>
                    Draw Controls
                  </h3>
                  <div className="space-y-5">
                    {/* Period */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Period</label>
                      <input
                        type="month"
                        value={drawPeriod}
                        onChange={(e) => setDrawPeriod(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/40"
                      />
                    </div>
                    {/* Mode toggle */}
                    <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">Algorithmic Mode</p>
                        <p className="text-[10px] text-on-surface-variant">Weighted by score frequency</p>
                      </div>
                      <button
                        onClick={() => setDrawMode(drawMode === "random" ? "algorithmic" : "random")}
                        className={`w-11 h-6 rounded-full transition-colors relative ${drawMode === "algorithmic" ? "bg-primary" : "bg-surface-container-highest"}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${drawMode === "algorithmic" ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleSimulate}
                        disabled={drawRunning}
                        className="bg-surface-container-highest text-on-surface py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">play_circle</span>
                        Simulate
                      </button>
                      <button
                        onClick={handleRunDraw}
                        disabled={drawRunning}
                        className="bg-primary text-on-primary py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>publish</span>
                        Run Draw
                      </button>
                    </div>

                    {drawMsg && (
                      <p className={`text-sm text-center font-bold ${drawMsg.startsWith("✓") ? "text-primary" : "text-error"}`}>{drawMsg}</p>
                    )}

                    {/* Simulation result */}
                    {simResult && (
                      <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Simulation Result</p>
                        <div className="flex gap-2 flex-wrap">
                          {(simResult.drawnNumbers as number[]).map((n) => (
                            <span key={n} className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-xs font-black text-primary">{String(n).padStart(2,"0")}</span>
                          ))}
                        </div>
                        {[
                          ["5 Match", simResult.fiveMatchWinners],
                          ["4 Match", simResult.fourMatchWinners],
                          ["3 Match", simResult.threeMatchWinners],
                          ["Prize Pool", gbp(simResult.totalPoolPence as number)],
                        ].map(([k, v]) => (
                          <div key={String(k)} className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">{String(k)}</span>
                            <span className="font-bold text-on-surface">{String(v as string)}{typeof v === "number" && String(k).includes("Match") ? "winner(s)" : ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Draw history */}
              <div className="xl:col-span-2 space-y-4">
                <h3 className="font-headline font-bold text-xl">Draw History</h3>
                {dataLoading ? (
                  <div className="text-on-surface-variant text-sm">Loading…</div>
                ) : draws.length === 0 ? (
                  <div className="text-on-surface-variant text-sm p-8 bg-surface-container rounded-2xl text-center">No draws yet. Run your first draw using the controls.</div>
                ) : draws.map((d) => (
                  <div key={d._id} className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-headline font-bold">{formatPeriod(d.period)}</p>
                        <p className="text-xs text-on-surface-variant capitalize">{d.drawMode} draw · {d.eligibleSubscriberCount} subscribers</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${d.status === "completed" ? "bg-primary/10 text-primary" : "bg-surface-variant text-on-surface-variant"}`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {d.drawnNumbers.map((n) => (
                        <span key={n} className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-xs font-black text-primary">{String(n).padStart(2,"0")}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {[
                        { label: "Jackpot", val: gbp(d.jackpotPoolPence), count: d.winners.filter(w=>w.matchType==="five").length },
                        { label: "4 Match", val: gbp(d.fourMatchPoolPence), count: d.winners.filter(w=>w.matchType==="four").length },
                        { label: "3 Match", val: gbp(d.threeMatchPoolPence), count: d.winners.filter(w=>w.matchType==="three").length },
                      ].map(({ label, val, count }) => (
                        <div key={label} className="bg-surface-container-lowest p-3 rounded-xl">
                          <p className="text-on-surface-variant mb-1">{label}</p>
                          <p className="font-bold text-on-surface">{val}</p>
                          <p className="text-primary font-bold">{count} winner{count !== 1 ? "s" : ""}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── CHARITIES ── */}
          {tab === "charities" && (
            <section className="space-y-6">
              {/* Add charity */}
              <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10">
                <h3 className="font-headline font-bold text-lg mb-6">Add New Charity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {[
                    { key: "name",        placeholder: "Charity name",    value: newCharity.name },
                    { key: "description", placeholder: "Short description", value: newCharity.description },
                    { key: "website",     placeholder: "Website URL",     value: newCharity.website },
                    { key: "imageUrl",    placeholder: "Image URL (e.g. https://...)",  value: newCharity.imageUrl },
                  ].map(({ key, placeholder, value }) => (
                    <input
                      key={key}
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => setNewCharity((p) => ({ ...p, [key]: e.target.value }))}
                      className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleAddCharity}
                    disabled={addingCharity}
                    className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
                  >
                    {addingCharity ? "Adding…" : "Add Charity"}
                  </button>
                  {charityMsg && <p className={`text-sm font-bold ${charityMsg.startsWith("✓") ? "text-primary" : "text-error"}`}>{charityMsg}</p>}
                </div>
              </div>

              {/* Charity list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {charities.map((c) => (
                  <div key={c._id} className={`bg-surface-container p-6 rounded-2xl border ${c.active ? "border-outline-variant/10" : "border-error/20 opacity-60"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-headline font-bold flex items-center gap-2">
                          {c.name}
                          {c.featured && <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded font-bold uppercase">Featured</span>}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{c.description}</p>
                      </div>
                    </div>
                    <p className="text-xs text-secondary font-bold mb-4">£{(c.totalRaised / 100).toLocaleString()} raised</p>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => handleToggleCharity(c._id, !c.active)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.active ? "bg-error/10 text-error hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"} transition-colors`}>
                        {c.active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => handleToggleFeatured(c._id, !c.featured)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">
                        {c.featured ? "Unfeature" : "Feature"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── WINNERS ── */}
          {tab === "winners" && (
            <section className="space-y-4">
              <h2 className="font-headline font-bold text-xl">Winner Verification</h2>
              {dataLoading ? (
                <div className="text-on-surface-variant text-sm">Loading…</div>
              ) : allWinners.length === 0 ? (
                <div className="text-on-surface-variant text-sm p-8 bg-surface-container rounded-2xl text-center">No winners yet.</div>
              ) : (
                <div className="space-y-3">
                  {/* Pending first */}
                  {[...allWinners].sort((a) => a.verificationStatus === "pending" ? -1 : 1).map((w, i) => {
                    const winnerUser = typeof w.userId === "object" ? w.userId : null;
                    const userId = typeof w.userId === "object" ? w.userId._id : w.userId;
                    const tierColor = w.matchType === "five" ? "border-secondary" : w.matchType === "four" ? "border-primary" : "border-outline-variant";
                    return (
                      <div key={i} className={`bg-surface-container p-6 rounded-2xl border-l-4 ${tierColor} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black font-headline text-sm">
                            {winnerUser?.name?.charAt(0) ?? "?"}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{winnerUser?.name ?? userId}</p>
                            <p className="text-xs text-on-surface-variant">{winnerUser?.email ?? ""}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{formatPeriod(w.draw.period)} · {w.matchType} match · <span className="text-secondary font-bold">{gbp(w.prizeAmountPence)}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {w.verificationStatus === "pending" ? (
                            <>
                              <button onClick={() => handleVerifyWinner(w.draw._id, userId, "approved")} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-black uppercase hover:scale-[1.02] transition-transform">
                                Mark Paid
                              </button>
                              <button onClick={() => handleVerifyWinner(w.draw._id, userId, "rejected")} className="px-4 py-2 bg-error/10 text-error rounded-xl text-xs font-black uppercase hover:bg-error/20 transition-colors">
                                Reject
                              </button>
                            </>
                          ) : (
                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase ${w.verificationStatus === "approved" ? "text-primary bg-primary/10" : "text-error bg-error/10"}`}>
                              <span className="material-symbols-outlined text-sm">{w.verificationStatus === "approved" ? "verified" : "cancel"}</span>
                              {w.verificationStatus}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
