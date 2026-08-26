"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import KPICard from "@/components/KPICard";
import ComplaintTable from "@/components/ComplaintTable";
import ActionPanel from "@/components/ActionPanel";
import { useAuth } from "@/components/AuthProvider";
import { CATEGORY_OPTIONS } from "@/lib/ui";

const DEPARTMENTS = [
  "Water & Sanitation",
  "Roads & Stormwater",
  "Electricity",
  "Waste Management",
  "Parks & Recreation",
  "Disaster & Risk Management",
  "General Services",
];

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState({
    status: "", category: "", priority: "", department: "", search: "", sort: "newest", overdue: false,
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "MUNICIPAL_ADMIN")) router.push("/login");
  }, [authLoading, user, router]);

  const loadStats = useCallback(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => setStats(d));
  }, []);

  const loadComplaints = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    fetch(`/api/complaints?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setComplaints(d.complaints || []))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    if (user?.role === "MUNICIPAL_ADMIN") {
      loadStats();
      loadComplaints();
    }
  }, [user, loadStats, loadComplaints]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function handleUpdated() {
    loadStats();
    loadComplaints();
  }

  if (authLoading || !user || user.role !== "MUNICIPAL_ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-civic-500" />
      </div>
    );
  }

  const t = stats?.totals;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-ink">Municipal Management Dashboard</h1>
        <p className="mt-1 text-civic-600">{user.department} · {user.name}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
          <KPICard label="Total" value={t?.total ?? "—"} />
          <KPICard label="Pending" value={t?.pending ?? "—"} accent="#8A5A00" />
          <KPICard label="In Progress" value={t?.inProgress ?? "—"} accent="#8A5A00" />
          <KPICard label="Overdue" value={t?.overdue ?? "—"} accent="#C4432B" />
          <KPICard label="Resolved" value={t?.resolved ?? "—"} accent="#1F6B45" />
          <KPICard label="Resolved Rate" value={t?.resolvedRate ?? "—"} suffix="%" accent="#1F6B45" />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 rounded-sm border border-civic-200 bg-white p-3">
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-sm border border-civic-300 px-2">
            <Search size={16} className="text-civic-400" />
            <input
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search title, description, address…"
              className="w-full py-2 text-sm outline-none"
            />
          </div>
          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className="rounded-sm border border-civic-300 px-2 py-2 text-sm">
            <option value="">All statuses</option>
            {["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REOPENED", "CLOSED"].map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <select value={filters.category} onChange={(e) => updateFilter("category", e.target.value)} className="rounded-sm border border-civic-300 px-2 py-2 text-sm">
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select value={filters.priority} onChange={(e) => updateFilter("priority", e.target.value)} className="rounded-sm border border-civic-300 px-2 py-2 text-sm">
            <option value="">All priorities</option>
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select value={filters.department} onChange={(e) => updateFilter("department", e.target.value)} className="rounded-sm border border-civic-300 px-2 py-2 text-sm">
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)} className="rounded-sm border border-civic-300 px-2 py-2 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Priority</option>
            <option value="overdue">Overdue first</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-civic-700">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(e) => updateFilter("overdue", e.target.checked)}
            />
            Overdue only
          </label>
        </div>

        <div className="mt-4">
          {loading ? (
            <Loader2 className="animate-spin text-civic-400" />
          ) : (
            <ComplaintTable complaints={complaints} onSelect={setSelected} />
          )}
        </div>
      </div>

      {selected && (
        <ActionPanel
          complaint={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
