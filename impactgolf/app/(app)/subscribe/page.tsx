"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Plan = "monthly" | "annual";

export default function SubscribePage() {
  const [selected, setSelected] = useState<Plan>("annual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user?.subscriptionStatus === "active") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

if (authLoading) return null;
if (user?.subscriptionStatus === "active") return null;

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = `/login?redirect=/subscribe`;
        return;
      }
      const res = await fetch("/api/stripe/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      window.location.href = "/subscribe/success";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout.");
    } finally {
      setLoading(false);
    }
  }

  const plans = [
    {
      id: "monthly" as Plan,
      name: "Monthly Impact",
      subtitle: "Flexible monthly commitment.",
      price: "£15",
      period: "/ month",
      icon: "calendar_month",
      iconStyle: {},
      features: [
        { text: "Entry into all Monthly Draws", active: true, gold: false },
        { text: "Direct Charity Contribution", active: true, gold: false },
        { text: "Exclusive Impact Member Badge", active: false, gold: false },
      ],
      badge: null,
      highlight: false,
    },
    {
      id: "annual" as Plan,
      name: "Yearly Legacy",
      subtitle: "Maximum impact, best value.",
      price: "£150",
      period: "/ year",
      icon: "military_tech",
      iconStyle: { fontVariationSettings: "'FILL' 1" },
      features: [
        { text: "Entry into all Monthly Draws", active: true, gold: false },
        { text: "Elite Tier Charity Impact", active: true, gold: false },
        { text: "Exclusive Impact Member Badge", active: true, gold: false },
        { text: "Bonus 'Major' Draw Entries", active: true, gold: true },
      ],
      badge: "Recommended",
      highlight: true,
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-32 px-6 max-w-7xl mx-auto">

        <header className="mb-20 text-center">
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-on-surface">
            Elevate Your <span className="text-primary">Impact.</span>
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Join our elite community. Every subscription fuels life-changing charities and places
            you in our premium prize draws.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 items-stretch">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`relative text-left p-10 rounded-xl flex flex-col justify-between transition-all duration-300 focus:outline-none ${
                plan.highlight
                  ? "bg-surface-container-high ring-2 ring-primary/30 shadow-[0_20px_50px_rgba(78,222,163,0.1)]"
                  : "bg-surface-container-low hover:bg-surface-container"
              } ${selected === plan.id ? "ring-2 ring-primary" : ""}`}
            >
              {plan.badge && (
                <div className="absolute -top-4 right-8 bg-[#f59e0b] text-[#2a1700] px-4 py-1 rounded-full text-xs font-bold font-headline tracking-wider uppercase">
                  {plan.badge}
                </div>
              )}
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-headline text-2xl font-bold">{plan.name}</h3>
                      {plan.id === "annual" && (
                        <span className="text-secondary font-bold text-xs bg-secondary/10 px-2 py-0.5 rounded">
                          Save 20%
                        </span>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-sm">{plan.subtitle}</p>
                  </div>
                  <span
                    className={`material-symbols-outlined text-3xl ${
                      plan.highlight ? "text-primary" : "text-primary-fixed-dim"
                    }`}
                    style={plan.iconStyle}
                  >
                    {plan.icon}
                  </span>
                </div>
                <div className="flex items-baseline mb-8">
                  <span className="text-4xl font-black font-headline">{plan.price}</span>
                  <span className="text-on-surface-variant ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 ${f.active ? "text-on-surface" : "text-on-surface-variant"}`}>
                      <span className={`material-symbols-outlined text-sm ${f.gold ? "text-secondary" : f.active ? "text-primary" : "text-outline"}`}>
                        {f.gold ? "star" : "check_circle"}
                      </span>
                      <span className={f.gold ? "font-bold" : ""}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={`w-full py-4 text-center font-bold rounded-md transition-all ${
                  plan.highlight
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                    : "border border-outline-variant hover:border-primary text-primary"
                } ${selected === plan.id ? "scale-[1.02]" : ""}`}
              >
                {selected === plan.id ? "✓ Selected" : `Select ${plan.id === "monthly" ? "Monthly" : "Yearly"}`}
              </div>
            </button>
          ))}
        </div>

        <section className="mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline text-3xl font-bold mb-6">Transparency by Design</h2>
              <p className="text-on-surface-variant mb-10 leading-relaxed">
                Every pound you contribute is split purposefully between the prize pool, our partner
                charities, and ensuring the platform stays elite.
              </p>
              <div className="space-y-8">
                {[
                  { label: "Platform & Operations", pct: 40, color: "bg-outline-variant", textColor: "text-on-surface-variant" },
                  { label: "Prize Pool", pct: 35, color: "bg-secondary", textColor: "text-secondary" },
                  { label: "Charity Donation", pct: 25, color: "bg-primary", textColor: "text-primary" },
                ].map(({ label, pct, color, textColor }) => (
                  <div key={label} className="space-y-3">
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                      <span>{label}</span>
                      <span className={textColor}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface-container-lowest p-2 rounded-2xl">
              <div className="w-full h-[400px] rounded-xl bg-surface-container-high flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-primary text-6xl block mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
                    golf_course
                  </span>
                  <p className="text-on-surface-variant text-sm font-body">Premium Golf Experience</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto">
          <div className="bg-surface-container p-8 md:p-12 rounded-2xl border border-outline-variant/15">
            <div className="text-center mb-10">
              <h2 className="font-headline text-2xl font-bold mb-2">Secure Checkout</h2>
              <p className="text-on-surface-variant text-sm">Powered by Stripe · Test mode active</p>
              <p className="text-on-surface-variant/60 text-xs mt-1">
                Stripe is not available in India — using simulated test checkout
              </p>
            </div>

            <div className="mb-8 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
              <div>
                <p className="font-headline font-bold text-on-surface">
                  {selected === "monthly" ? "Monthly Impact" : "Yearly Legacy"}
                </p>
                <p className="text-on-surface-variant text-sm">
                  {selected === "monthly" ? "£15 / month" : "£150 / year · 20% saved"}
                </p>
              </div>
              <button
                onClick={() => setSelected(selected === "monthly" ? "annual" : "monthly")}
                className="text-primary text-sm font-bold hover:underline"
              >
                Change
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-5 bg-primary text-on-primary font-headline font-extrabold text-lg rounded-md transition-all active:scale-[0.98] shadow-xl shadow-primary/10 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Activating..." : "Complete Subscription"}
            </button>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60">
              {[
                { icon: "lock", label: "Secure SSL" },
                { icon: "verified_user", label: "Fraud Protected" },
                { icon: "event_busy", label: "Cancel Anytime" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">{icon}</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
