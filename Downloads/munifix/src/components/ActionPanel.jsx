"use client";

import { useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/ui";

const STATUS_FLOW = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
const DEPARTMENTS = [
  "Water & Sanitation",
  "Roads & Stormwater",
  "Electricity",
  "Waste Management",
  "Parks & Recreation",
  "Disaster & Risk Management",
  "General Services",
];

export default function ActionPanel({ complaint, onClose, onUpdated }) {
  const [status, setStatus] = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [department, setDepartment] = useState(complaint.assigned_department || "");
  const [team, setTeam] = useState(complaint.assigned_team || "");
  const [notes, setNotes] = useState(complaint.internal_notes || "");
  const [resolutionNote, setResolutionNote] = useState(complaint.resolution_note || "");
  const [proofUrl, setProofUrl] = useState(complaint.resolution_proof_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleProofUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProofUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        status,
        priority,
        assigned_department: department,
        assigned_team: team,
        internal_notes: notes,
      };
      if (status === "RESOLVED") {
        payload.resolution_note = resolutionNote;
        if (proofUrl) payload.resolution_proof_url = proofUrl;
      }
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.complaint);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-civic-200 p-5">
          <div>
            <p className="stamp text-[11px] text-civic-500">{complaint.id}</p>
            <h2 className="font-display text-xl font-bold text-ink">{complaint.title}</h2>
            <div className="mt-1"><StatusBadge status={complaint.status} overdue={complaint.is_overdue} /></div>
          </div>
          <button onClick={onClose} className="rounded-sm p-1 text-civic-400 hover:bg-civic-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Reported by</p>
            <p className="text-sm text-civic-600">{complaint.reporter_name} · {formatDate(complaint.created_at)}</p>
          </div>

          <p className="text-sm leading-relaxed text-civic-700">{complaint.description}</p>

          {complaint.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={complaint.photo_url} alt="" className="w-full rounded-sm border border-civic-200" />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-civic-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-sm border border-civic-300 px-2 py-2 text-sm"
              >
                {[...STATUS_FLOW, "REOPENED", "CLOSED"].map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-civic-500">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-sm border border-civic-300 px-2 py-2 text-sm"
              >
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-civic-500">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-sm border border-civic-300 px-2 py-2 text-sm"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-civic-500">Maintenance team (optional)</label>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Roads Crew 3"
              className="w-full rounded-sm border border-civic-300 px-2 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-civic-500">Internal notes (staff only)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-sm border border-civic-300 px-2 py-2 text-sm"
              placeholder="Notes visible only to municipal staff"
            />
          </div>

          {status === "RESOLVED" && (
            <div className="space-y-3 rounded-sm border border-signal-green/30 bg-signal-green/5 p-3">
              <p className="text-sm font-semibold text-ink">Proof of resolution</p>
              <p className="text-xs text-civic-600">Attach a photo or note — the resident will be asked to confirm the fix.</p>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-civic-300 bg-white px-3 py-3 text-sm text-civic-600 hover:bg-civic-50">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {proofUrl ? "Replace photo" : "Upload photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
              </label>
              {proofUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofUrl} alt="Proof" className="h-32 w-full rounded-sm object-cover" />
              )}
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={2}
                placeholder="Resolution note (e.g. what was done)"
                className="w-full rounded-sm border border-civic-300 px-2 py-2 text-sm"
              />
            </div>
          )}

          {error && <p className="rounded-sm bg-signal-red/10 px-3 py-2 text-sm text-signal-red">{error}</p>}
        </div>

        <div className="border-t border-civic-200 p-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-civic-800 px-4 py-3 font-semibold text-white hover:bg-civic-700 disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
