"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import ComplaintCard from "@/components/ComplaintCard";
import { CATEGORY_OPTIONS } from "@/lib/ui";
import { Loader2 } from "lucide-react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    fetch(`/api/complaints?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setComplaints(data.complaints || []))
      .finally(() => setLoading(false));
  }, [category, status]);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Live service-delivery map</h1>
            <p className="mt-1 text-civic-600">
              <span className="inline-flex items-center gap-1"><Dot color="#C4432B" /> Submitted</span>{" "}
              <span className="inline-flex items-center gap-1"><Dot color="#D98E2B" /> In progress</span>{" "}
              <span className="inline-flex items-center gap-1"><Dot color="#2E8B57" /> Resolved</span>
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-sm border border-civic-300 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-sm border border-civic-300 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <MapView mode="view" complaints={complaints} height={560} />
          <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <Loader2 className="animate-spin text-civic-400" />
            ) : complaints.length === 0 ? (
              <p className="text-sm text-civic-500">No reports match these filters.</p>
            ) : (
              complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ color }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}
