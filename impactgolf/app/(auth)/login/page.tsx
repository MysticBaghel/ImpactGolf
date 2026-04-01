"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Tab = "login" | "register";

interface FormState {
  name: string;
  email: string;
  password: string;
  agreed: boolean;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", email: "", password: "", agreed: false });

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    if (tab === "register") {
      if (!form.name.trim()) return setError("Please enter your full name.");
      if (!form.agreed) return setError("Please accept the Terms of Play to continue.");
    }
    if (!form.email.trim()) return setError("Please enter your email address.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const endpoint = tab === "register" ? "/api/auth/register" : "/api/auth/login";
      const body =
        tab === "register"
          ? { name: form.name, email: form.email, password: form.password }
          : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest font-body text-on-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] z-0" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(78,222,163,0.05),transparent_60%)] z-0" />

      <main className="relative z-10 w-full max-w-[480px]">
        <div className="text-center mb-10">
          <Link href="/" className="font-headline font-black tracking-tighter text-4xl text-primary mb-2 block">
            ImpactGolf
          </Link>
          <p className="font-body text-on-surface-variant text-sm tracking-[0.2em] uppercase">
            Elite Charity Drawings
          </p>
        </div>

        <div className="bg-[rgba(28,27,27,0.6)] backdrop-blur-xl rounded-xl border border-outline-variant/15 p-8 shadow-[0_48px_48px_rgba(0,0,0,0.3)]">
          <div className="flex p-1 bg-surface-container-lowest rounded-lg mb-8">
            {(["register", "login"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-300 ${
                  tab === t
                    ? "bg-surface-container-high text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t === "register" ? "Sign Up" : "Login"}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {tab === "register" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">person</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Tiger Woods"
                    className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-md py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary/60 focus:bg-surface-container-low transition-all duration-300 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="champion@impactgolf.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-md py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary/60 focus:bg-surface-container-low transition-all duration-300 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-md py-3 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary/60 focus:bg-surface-container-low transition-all duration-300 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {tab === "register" && (
              <div className="flex items-start gap-3 py-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={form.agreed}
                  onChange={(e) => set("agreed", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-outline-variant/30 bg-surface-container-lowest accent-primary"
                />
                <label htmlFor="terms" className="text-[11px] leading-relaxed text-on-surface-variant cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline underline-offset-4">Terms of Play</Link>
                  {" "}and understand that a minimum 10% of my subscription goes directly to my chosen charity.
                </label>
              </div>
            )}

            {tab === "login" && (
              <div className="flex justify-end">
                <button className="text-xs text-on-surface-variant hover:text-primary transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary font-headline font-bold text-sm tracking-widest uppercase rounded-md shadow-[0_10px_30px_rgba(78,222,163,0.3)] hover:shadow-[0_15px_40px_rgba(78,222,163,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait…" : tab === "register" ? "Create Account" : "Sign In"}
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-on-surface-variant/60 font-medium">
            Secure encryption powered by ImpactSafe™
          </p>
        </div>

        <div className="mt-12 flex justify-center gap-8">
          {[
            { href: "/contact", label: "Support" },
            { href: "/impact", label: "Impact Report" },
            { href: "/privacy", label: "Privacy" },
          ].map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </main>

      <aside className="hidden xl:flex fixed right-16 top-1/2 -translate-y-1/2 flex-col items-end text-right max-w-sm pointer-events-none">
        <span
          className="material-symbols-outlined text-secondary text-5xl block mb-4"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          military_tech
        </span>
        <h2 className="font-headline font-extrabold text-5xl text-on-surface mb-4 leading-tight">
          Join the<br />
          <span className="text-primary">Impact Tier.</span>
        </h2>
        <p className="font-body text-on-surface-variant text-lg leading-relaxed mb-8">
          Become more than a player. Every draw supports verified charities worldwide.
        </p>
        <div className="bg-surface-container-high/40 backdrop-blur-md p-6 rounded-xl border-l-4 border-secondary">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Live Impact</div>
          <div className="text-3xl font-black text-on-surface">£248K+</div>
          <div className="text-sm text-on-surface-variant mt-1 italic">Raised for Clean Water</div>
        </div>
      </aside>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}