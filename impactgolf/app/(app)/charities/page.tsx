"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

interface Charity {
  _id: string;
  name: string;
  description: string;
  logoUrl?: string;
  imageUrl?: string;
  website?: string;
  featured: boolean;
  totalRaised: number;
  upcomingEvents: { title: string; date: string; description?: string }[];
}

const CATEGORY_ICONS: Record<string, string> = {
  "Clean Water Initiative": "water_drop",
  "Reforestation Trust": "forest",
  "Children's Education Fund": "school",
  "Mental Health Alliance": "psychology",
  "Ocean Cleanup Project": "waves",
  "Hunger Relief Network": "restaurant",
};

function penceToGBP(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchCharities();
    // Load user's current charity selection
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/user/charity", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.charityId) {
            const id = typeof d.charityId === "object" ? d.charityId._id : d.charityId;
            setSelectedId(id);
          }
        })
        .catch(() => {});
    }
  }, []);

  async function fetchCharities(q = "") {
    setLoading(true);
    const url = q ? `/api/charities?search=${encodeURIComponent(q)}` : "/api/charities";
    const res = await fetch(url);
    const data = await res.json();
    if (data.charities) setCharities(data.charities);
    setLoading(false);
  }

  function handleSearch(val: string) {
    setSearch(val);
    const timeout = setTimeout(() => fetchCharities(val), 300);
    return () => clearTimeout(timeout);
  }

  async function handleSelect(charityId: string) {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login?redirect=/charities"; return; }
    setSelecting(charityId);
    const res = await fetch("/api/user/charity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ charityId }),
    });
    setSelecting(null);
    if (res.ok) {
      setSelectedId(charityId);
      setSuccessMsg("Charity updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  }

  const featured = charities.find((c) => c.featured);
  const rest = charities.filter((c) => !c.featured || search);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">

        {/* Success toast */}
        {successMsg && (
          <div className="fixed top-24 right-6 z-50 px-5 py-3 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm shadow-lg animate-in">
            {successMsg}
          </div>
        )}

        {/* ── FEATURED SPOTLIGHT ── */}
        {!search && featured && (
          <section className="mb-20">
            <div className="relative w-full h-[500px] rounded-3xl overflow-hidden group shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=1400&q=80"
                alt={featured.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
                <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary border border-secondary/30 px-3 py-1 rounded-full mb-6">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-bold tracking-widest uppercase font-label">Monthly Spotlight</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black font-headline text-on-surface mb-4 tracking-tighter leading-tight">
                  {featured.name.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-primary">{featured.name.split(" ").slice(-1)}</span>
                </h1>
                <p className="text-on-surface-variant text-lg font-body max-w-xl mb-8 leading-relaxed">
                  {featured.description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleSelect(featured._id)}
                    disabled={selecting === featured._id}
                    className={`px-8 py-4 rounded-lg font-bold flex items-center gap-2 transition-all ${
                      selectedId === featured._id
                        ? "bg-primary/20 text-primary border border-primary"
                        : "bg-primary text-on-primary hover:bg-primary/90"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {selectedId === featured._id ? "check_circle" : "favorite"}
                    </span>
                    {selectedId === featured._id ? "Your Charity" : selecting === featured._id ? "Saving…" : "Support This Charity"}
                  </button>
                  <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-lg border border-white/10">
                    <span className="text-secondary font-headline font-bold text-2xl">
                      {penceToGBP(featured.totalRaised)}
                    </span>
                    <span className="text-on-surface-variant text-xs uppercase tracking-widest">Raised Together</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── SEARCH & FILTERS ── */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="relative w-full md:max-w-md">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-surface-container-lowest ring-1 ring-outline-variant/15 focus:ring-primary/40 rounded-xl py-4 pl-12 pr-6 text-on-surface font-body transition-all outline-none"
                placeholder="Search charities..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
              {["All", "Environment", "Health", "Education", "Humanitarian"].map((cat) => (
                <button
                  key={cat}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    cat === "All"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant border border-outline-variant/15 hover:border-primary/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── CHARITY GRID ── */}
        <section>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((charity) => {
                const icon = CATEGORY_ICONS[charity.name] ?? "volunteer_activism";
                const isSelected = selectedId === charity._id;
                const hasEvent = charity.upcomingEvents.length > 0;
                return (
                  <div
                    key={charity._id}
                    className={`group bg-surface-container-low rounded-2xl overflow-hidden hover:bg-surface-container-high transition-all duration-300 border ${
                      isSelected ? "border-primary/40" : "border-outline-variant/10"
                    }`}
                  >
                    {/* Card image / icon area */}
                    <div className="relative h-52 overflow-hidden bg-surface-container-high flex items-center justify-center">
                      {charity.imageUrl ? (
                        <img
                          src={charity.imageUrl}
                          alt={charity.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span
                          className="material-symbols-outlined text-primary/30 text-[7rem] group-hover:scale-110 transition-transform duration-500"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {icon}
                        </span>
                      )}
                      {hasEvent && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-primary/90 text-on-primary px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-primary animate-pulse" />
                            Event Active
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check</span>
                          Your Charity
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/20">
                          <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
                        </div>
                        <h3 className="text-lg font-headline font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
                          {charity.name}
                        </h3>
                      </div>
                      <p className="text-on-surface-variant font-body text-sm line-clamp-2 leading-relaxed mb-6">
                        {charity.description}
                      </p>

                      {/* Upcoming event */}
                      {charity.upcomingEvents[0] && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/10">
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label mb-1">Next Event</p>
                          <p className="text-sm font-bold text-on-surface">{charity.upcomingEvents[0].title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {new Date(charity.upcomingEvents[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      )}

                      <div className="pt-6 border-t border-outline-variant/15 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label mb-1">Impact Raised</p>
                          <p className="text-secondary font-headline font-bold text-lg">{penceToGBP(charity.totalRaised)}</p>
                        </div>
                        <button
                          onClick={() => handleSelect(charity._id)}
                          disabled={selecting === charity._id}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            isSelected
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary"
                          }`}
                        >
                          {selecting === charity._id ? "…" : isSelected ? "Selected" : "Support"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
