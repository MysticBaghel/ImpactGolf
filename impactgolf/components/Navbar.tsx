"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  return (
    <>
      {/* Desktop nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/60 backdrop-blur-xl">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#4edea3] font-headline">
            ImpactGolf
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {[
              { href: "/draws", label: "Draws" },
              { href: "/charities", label: "Charities" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors font-headline font-bold tracking-tight ${
                  pathname === href ? "text-[#4edea3]" : "text-[#bbcabf] hover:text-[#e5e2e1]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!loading && !user && (
              <>
                <Link
                  href="/login"
                  className="text-[#bbcabf] hover:text-[#e5e2e1] font-headline font-bold transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#4edea3] text-[#003824] px-5 py-2 rounded-md font-headline font-bold transition-transform hover:scale-105 active:scale-95"
                >
                  Join the Draw
                </Link>
              </>
            )}
            {!loading && user && (
              <>
                <Link
                  href="/dashboard"
                  className={`font-headline font-bold transition-colors ${
                    pathname === "/dashboard" ? "text-[#4edea3]" : "text-[#bbcabf] hover:text-[#e5e2e1]"
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-[#bbcabf] hover:text-white font-headline font-bold transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#131313]/80 backdrop-blur-2xl md:hidden z-50 rounded-t-3xl border-t border-[#3c4a42]/10 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        {[
          { href: "/", icon: "home", label: "Home" },
          { href: "/draws", icon: "golf_course", label: "Draws" },
          { href: "/charities", icon: "volunteer_activism", label: "Impact" },
          user
            ? { href: "/dashboard", icon: "person", label: "Profile" }
            : { href: "/login", icon: "login", label: "Login" },
        ].map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-colors ${
                active ? "bg-[#4edea3]/20 text-[#4edea3]" : "text-[#bbcabf]"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="text-[10px] uppercase tracking-widest mt-1">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
