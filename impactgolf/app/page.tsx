import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background image — Unsplash golf course dawn */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/Hero_bg.png"
            alt="Golf course at dawn"
            fill
            priority
            className="object-cover opacity-35 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e0e]/60 via-transparent to-[#131313]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(78,222,163,0.08),transparent_60%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary font-headline font-bold text-xs tracking-[0.2em] uppercase mb-8">
            Elevated Charity
          </span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter font-headline mb-8 leading-[0.9]">
            Play Golf. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed">
              Win Prizes.
            </span>{" "}
            <br />
            Change Lives.
          </h1>
          <p className="max-w-2xl mx-auto text-on-surface-variant text-lg md:text-xl leading-relaxed mb-12 font-light">
            ImpactGolf turns every round into a catalyst for global change. Compete in elite draws
            while funding world-class humanitarian missions.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link
              href="/subscribe"
              className="w-full md:w-auto px-10 py-5 bg-primary text-on-primary font-headline font-extrabold text-lg rounded-md transition-all hover:shadow-[0_0_30px_rgba(78,222,163,0.3)] hover:scale-[1.02]"
            >
              Enter Active Draw
            </Link>
            <Link
              href="/draws"
              className="w-full md:w-auto px-10 py-5 bg-white/5 border border-outline-variant/30 backdrop-blur-xl text-on-surface font-headline font-bold text-lg rounded-md hover:bg-white/10 transition-all"
            >
              View Impact Report
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3-COLUMN FEATURE STRIP ── */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: "military_tech",
              iconColor: "text-primary",
              bgColor: "bg-primary/10",
              title: "How you win",
              body: "Submit your last 5 Stableford scores to enter our monthly prestige draws. The best average wins.",
            },
            {
              icon: "volunteer_activism",
              iconColor: "text-secondary",
              bgColor: "bg-secondary/10",
              title: "How charity works",
              body: "25% of every subscription is pooled directly into your chosen verified impact partner, bypassing administrative bloat.",
            },
            {
              icon: "redeem",
              iconColor: "text-primary-fixed",
              bgColor: "bg-primary-fixed/10",
              title: "What you score",
              body: "From luxury golf experiences to cash prizes. The monthly jackpot rolls over if unclaimed — it keeps growing.",
            },
          ].map(({ icon, iconColor, bgColor, title, body }) => (
            <div key={title} className="group">
              <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
              </div>
              <h3 className="text-2xl font-headline font-bold mb-4">{title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CHARITY SPOTLIGHT ── */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Image */}
            <div className="lg:col-span-7 relative group">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl group-hover:bg-primary/10 transition-all" />
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/hero_image.png"
                  alt="Clean water initiative"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <span className="px-4 py-2 bg-secondary text-on-secondary font-headline font-bold text-xs uppercase tracking-widest rounded-full">
                    Prestige Partner
                  </span>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="lg:col-span-5">
              <h2 className="text-4xl md:text-5xl font-headline font-black tracking-tight mb-8">
                This Month&apos;s Focus: <br />
                <span className="text-primary">Clean Water Initiative</span>
              </h2>
              <p className="text-xl text-on-surface-variant font-light leading-relaxed mb-8">
                We are partnering with the Global Water Trust to build sustainable solar-powered wells
                across three sub-Saharan regions. Every golf round entered this month provides clean
                water for one family for a year.
              </p>
              <div className="bg-surface-container p-8 rounded-2xl border-l-4 border-secondary mb-10">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-on-surface-variant font-label text-sm uppercase tracking-widest">
                    Total Donations to Date
                  </span>
                  <span className="text-3xl font-headline font-black text-secondary">£248,500</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-container to-primary w-[78%]" />
                </div>
              </div>
              <Link
                href="/charities"
                className="group flex items-center gap-3 text-primary font-headline font-bold text-lg"
              >
                Meet the Beneficiaries
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP CYCLE ── */}
      <section className="bg-surface-container-lowest py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-headline font-black tracking-tighter mb-6">
              The Cycle of Excellence
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent -translate-y-1/2 z-0" />
            {[
              { step: "01", title: "Register", body: "Join the Impact Member tier. Set your charitable preference and unlock premium prize eligibility.", offset: false },
              { step: "02", title: "Play", body: "Play your usual weekend round. Enter your last 5 Stableford scores to keep your draw entry live.", offset: true },
              { step: "03", title: "Impact", body: "Enter the draw for luxury prizes while your contribution builds real-world infrastructure.", offset: false },
            ].map(({ step, title, body, offset }) => (
              <div
                key={step}
                className={`relative z-10 bg-surface-container-low p-10 rounded-3xl border border-outline-variant/10 text-center hover:bg-surface-container transition-colors ${offset ? "md:translate-y-8" : ""}`}
              >
                <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <span className="text-3xl font-black text-primary font-headline">{step}</span>
                </div>
                <h4 className="text-2xl font-headline font-bold mb-4">{title}</h4>
                <p className="text-on-surface-variant">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* ── STICKY CTA BAR ── */}
      <div className="fixed bottom-0 left-0 w-full z-[60] p-4 pointer-events-none hidden md:block">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-surface-container-high/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
              </div>
              <div>
                <div className="font-headline font-bold text-on-surface">Become an Impact Member</div>
                <div className="text-sm text-on-surface-variant">Exclusive prizes &amp; verified social impact</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Starting from</div>
                <div className="font-headline font-black text-primary">£15/month</div>
              </div>
              <Link
                href="/subscribe"
                className="px-8 py-3 bg-primary text-on-primary font-headline font-extrabold rounded-lg hover:scale-105 transition-transform"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
