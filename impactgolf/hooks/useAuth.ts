"use client";
import { useState, useEffect } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  subscriptionStatus: "active" | "inactive" | "cancelled" | "past_due";
  subscriptionPlan?: "monthly" | "annual";
  charityId?: string | { _id: string; name: string; logoUrl?: string };
  charityContributionPercent?: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem("token");
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const getToken = () => localStorage.getItem("token") ?? "";

  const refreshUser = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.user) setUser(data.user); });
  };

  return { user, loading, logout, getToken, refreshUser };
}
