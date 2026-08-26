"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import ComplaintCard from "@/components/ComplaintCard";
import EmergencyButton from "@/components/EmergencyButton";
import KPICard from "@/components/KPICard";
import { useAuth } from "@/components/AuthProvider";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/complaints?scope=mine&sort=newest")
      .then((r) => r.json())
      .then((data) => setComplaints(data.complaints || []))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-civic-500" />
      </div>
    );
  }

  const open = complaints.filter((c) => !["CLOSED"].includes(c.status));
  const overdue = complaints.filter((c) => c.is_overdue).length;
  const resolved = complaints.filter((c) => ["RESOLVED", "CLOSED"].includes(c.status)).length;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Welcome back, {user.name.split(" ")[0]}</h1>
            <p className="mt-1 text-civic-600">Here's what's happening with your reports.</p>
          </div>
          <div className="flex gap-2">
            <EmergencyButton />
            <Link
              href="/dashboard/new"
              className="flex items-center gap-2 rounded-sm bg-signal-amber px-4 py-2.5 text-sm font-semibold text-civic-900 hover:bg-signal-amber/90"
            >
              <Plus size={16} /> Report an issue
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <KPICard label="Total Reports" value={complaints.length} />
          <KPICard label="Open" value={open.length} accent="#8A5A00" />
          <KPICard label="Overdue" value={overdue} accent="#C4432B" />
          <KPICard label="Resolved" value={resolved} accent="#1F6B45" />
        </div>

        <div className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold text-ink">Your reports</h2>
          {loading ? (
            <Loader2 className="animate-spin text-civic-400" />
          ) : complaints.length === 0 ? (
            <div className="rounded-sm border border-dashed border-civic-300 bg-white p-10 text-center">
              <p className="text-civic-600">You haven't reported anything yet.</p>
              <Link href="/dashboard/new" className="mt-3 inline-block font-semibold text-civic-800 underline">
                Report your first issue
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
