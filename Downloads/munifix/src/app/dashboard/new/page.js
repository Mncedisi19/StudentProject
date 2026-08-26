"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Sparkles, Upload, Loader2, LocateFixed, Camera } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { CATEGORY_OPTIONS } from "@/lib/ui";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function NewComplaintPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null); // {lat, lng}
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [visionSuggestion, setVisionSuggestion] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    // Mock vision classifier: analyze the filename as a stand-in for real
    // image classification (spec 3A "Mock/Real Vision Classifier").
    fetch("/api/ai/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.suggestion) {
          setVisionSuggestion(data.suggestion);
          if (!category) setCategory(data.suggestion.category);
        }
      })
      .catch(() => {});
  }

  async function handleAnalyze() {
    if (description.trim().length < 5) {
      setError("Write a short description first, then run the AI assist.");
      return;
    }
    setError("");
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiSuggestion(data);
      setCategory(data.category);
      setPriority(data.priority);
      if (!title) setTitle(data.suggestedTitle);
      if (data.locationHint && !address) setAddress(data.locationHint);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support GPS location. Drop a pin on the map instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your GPS location. Drop a pin on the map instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!description.trim()) return setError("Please describe the issue.");
    if (!location) return setError("Set a location — use GPS or drop a pin on the map.");

    setSubmitting(true);
    try {
      let photo_url = null;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error);
        photo_url = upData.url;
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: category || undefined,
          priority: priority || undefined,
          latitude: location.lat,
          longitude: location.lng,
          address,
          photo_url,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/complaints/${data.complaint.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-civic-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-ink">Report an issue</h1>
        <p className="mt-1 text-civic-600">
          Describe what you see — our assistant will suggest the category, priority, and department.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">What's wrong?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              placeholder="e.g. There's a water leak flooding the road on Church Street, been running since yesterday"
              className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-2 flex items-center gap-2 rounded-sm border border-civic-800 px-3 py-2 text-sm font-semibold text-civic-800 hover:bg-civic-800 hover:text-white disabled:opacity-60"
            >
              {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              AI-assist: auto-fill category & priority
            </button>
            {aiSuggestion && (
              <p className="mt-2 text-xs text-civic-500">
                Detected <strong>{aiSuggestion.categoryLabel}</strong> · priority{" "}
                <strong>{aiSuggestion.priority}</strong> · routed to {aiSuggestion.department}
                {aiSuggestion.locationHint ? ` · near "${aiSuggestion.locationHint}"` : ""}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Title (optional — we'll suggest one)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
              placeholder="Short summary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
              >
                <option value="">Let AI decide</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
              >
                <option value="">Let AI decide</option>
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Photo evidence</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-civic-300 bg-white px-3 py-6 text-sm text-civic-600 hover:bg-civic-50">
              <Camera size={18} />
              {photoFile ? photoFile.name : "Upload a photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="mt-2 h-40 w-full rounded-sm object-cover" />
            )}
            {visionSuggestion && (
              <p className="mt-2 text-xs text-civic-500">
                Photo looks like <strong>{visionSuggestion.categoryLabel}</strong> — category updated.
              </p>
            )}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-semibold text-ink">Location</label>
              <button
                type="button"
                onClick={handleLocate}
                disabled={locating}
                className="flex items-center gap-1.5 text-sm font-semibold text-civic-800 hover:underline"
              >
                {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                Use my GPS location
              </button>
            </div>
            <p className="mb-2 text-xs text-civic-500">Or tap on the map to drop a pin.</p>
            <MapView
              mode="pick"
              value={location ? { lat: location.lat, lng: location.lng } : null}
              onChange={(lat, lng) => setLocation({ lat, lng })}
              height={320}
            />
            {location && (
              <p className="mt-1 stamp text-[11px] text-civic-500">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            )}
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-2 w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
              placeholder="Street / landmark (optional, helps crews find it)"
            />
          </div>

          {error && <p className="rounded-sm bg-signal-red/10 px-3 py-2 text-sm text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-civic-800 px-4 py-3 font-semibold text-white hover:bg-civic-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Submit report
          </button>
        </form>
      </div>
    </div>
  );
}
