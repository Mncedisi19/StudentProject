"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "RESIDENT",
    department: "General Services",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      router.push(user.role === "MUNICIPAL_ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-ink">Create an account</h1>
        <p className="mt-1 text-sm text-civic-600">Report issues in your area and track the fix.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="flex gap-2 rounded-sm border border-civic-300 p-1">
            {[
              { v: "RESIDENT", l: "Resident" },
              { v: "MUNICIPAL_ADMIN", l: "Municipal Official" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.v}
                onClick={() => update("role", opt.v)}
                className={`flex-1 rounded-sm py-2 text-sm font-semibold transition-colors ${
                  form.role === opt.v ? "bg-civic-800 text-white" : "text-civic-600 hover:bg-civic-50"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Phone (optional)</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
              placeholder="For emergency contact only"
            />
          </div>
          {form.role === "MUNICIPAL_ADMIN" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">Department</label>
              <select
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
              >
                {[
                  "General Services",
                  "Water & Sanitation",
                  "Roads & Stormwater",
                  "Electricity",
                  "Waste Management",
                  "Parks & Recreation",
                  "Disaster & Risk Management",
                ].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="rounded-sm bg-signal-red/10 px-3 py-2 text-sm text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-civic-800 px-4 py-3 font-semibold text-white hover:bg-civic-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-civic-600">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-civic-800 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
