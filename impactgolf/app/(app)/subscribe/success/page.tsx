"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function SubscribeSuccessPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); window.location.href = "/dashboard"; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter mb-4">
            You&apos;re In.
          </h1>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            Your subscription is active. You&apos;re now entered into the monthly draws and your
            charity contribution is live.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-primary text-on-primary font-headline font-bold px-8 py-4 rounded-md hover:scale-[1.02] transition-transform"
          >
            Go to Dashboard
          </Link>
          <p className="text-on-surface-variant text-sm mt-6">
            Redirecting in {countdown}s…
          </p>
        </div>
      </main>
    </>
  );
}
