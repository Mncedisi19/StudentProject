"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ThumbsUp, CheckCircle2, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { useAuth } from "@/components/AuthProvider";
import { formatDate, timeUntil } from "@/lib/ui";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);

  async function load() {
    const res = await fetch(`/api/complaints/${id}`);
    const data = await res.json();
    if (res.ok) {
      setComplaint(data.complaint);
      setEvents(data.events || []);
    } else {
      setError(data.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleMeToo() {
    if (!user) return router.push("/login");
    const res = await fetch(`/api/complaints/${id}/metoo`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setComplaint((c) => ({ ...c, i_me_tooed: data.i_me_tooed, me_too_count: data.me_too_count }));
    }
  }

  async function handleConfirm(confirmed) {
    setActing(true);
    setError("");
    try {
      const res = await fetch(`/api/complaints/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed, reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      setShowReject(false);
      setRejectReason("");
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-civic-500" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-civic-600">{error || "Complaint not found."}</div>
      </div>
    );
  }

  const isOwner = user && user.id === complaint.user_id;
  const needsVerification = isOwner && complaint.status === "RESOLVED";

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="stamp text-xs text-civic-500">{complaint.id}</p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-ink">{complaint.title}</h1>
          <button
            onClick={handleMeToo}
            className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-semibold transition-colors ${
              complaint.i_me_tooed
                ? "border-civic-800 bg-civic-800 text-white"
                : "border-civic-300 text-civic-700 hover:bg-civic-50"
            }`}
          >
            <ThumbsUp size={16} /> Me Too ({complaint.me_too_count || 0})
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={complaint.status} overdue={complaint.is_overdue} />
          <PriorityBadge priority={complaint.priority} />
          <span className="text-sm text-civic-500">{complaint.assigned_department}</span>
        </div>

        {needsVerification && (
          <div className="mt-6 rounded-sm border border-signal-green/40 bg-signal-green/5 p-5">
            <h2 className="font-display text-lg font-bold text-ink">Has this been fixed?</h2>
            <p className="mt-1 text-sm text-civic-600">
              A municipal official marked this resolved. Please confirm so we can close it out.
            </p>
            {complaint.resolution_note && (
              <p className="mt-2 text-sm italic text-civic-700">"{complaint.resolution_note}"</p>
            )}
            {complaint.resolution_proof_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={complaint.resolution_proof_url}
                alt="Proof of resolution"
                className="mt-3 h-48 w-full rounded-sm object-cover"
              />
            )}

            {!showReject ? (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleConfirm(true)}
                  disabled={acting}
                  className="flex items-center gap-2 rounded-sm bg-signal-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-signal-green/90 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} /> Yes, it's fixed
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={acting}
                  className="flex items-center gap-2 rounded-sm border border-signal-red px-4 py-2.5 text-sm font-semibold text-signal-red hover:bg-signal-red/10"
                >
                  <XCircle size={16} /> Still a problem
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="Tell us what's still wrong"
                  className="w-full rounded-sm border border-civic-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleConfirm(false)}
                    disabled={acting || !rejectReason.trim()}
                    className="rounded-sm bg-signal-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-signal-red/90 disabled:opacity-60"
                  >
                    Reopen & escalate
                  </button>
                  <button onClick={() => setShowReject(false)} className="text-sm text-civic-500 underline">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            {complaint.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={complaint.photo_url} alt="" className="w-full rounded-sm border border-civic-200" />
            )}
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-civic-700">{complaint.description}</p>
            <dl className="mt-4 space-y-1 text-sm text-civic-600">
              <div className="flex justify-between border-b border-civic-100 py-1.5">
                <dt>Reported by</dt>
                <dd>{complaint.reporter_name}</dd>
              </div>
              <div className="flex justify-between border-b border-civic-100 py-1.5">
                <dt>Submitted</dt>
                <dd>{formatDate(complaint.created_at)}</dd>
              </div>
              {complaint.response_deadline && (
                <div className="flex justify-between border-b border-civic-100 py-1.5">
                  <dt>Response window</dt>
                  <dd>{timeUntil(complaint.response_deadline)}</dd>
                </div>
              )}
              {complaint.address && (
                <div className="flex justify-between border-b border-civic-100 py-1.5">
                  <dt>Location</dt>
                  <dd className="text-right">{complaint.address}</dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <MapView
              mode="view"
              complaints={[complaint]}
              center={[complaint.latitude, complaint.longitude]}
              zoom={16}
              height={220}
            />
            <div className="mt-4">
              <h3 className="mb-2 font-display text-base font-bold text-ink">Timeline</h3>
              <ol className="space-y-3 border-l-2 border-civic-200 pl-4">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-civic-500" />
                    <p className="text-sm text-ink">{e.message}</p>
                    <p className="text-xs text-civic-400">
                      {formatDate(e.created_at)}
                      {e.actor_name ? ` · ${e.actor_name}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
