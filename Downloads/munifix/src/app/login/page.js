"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
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
        <h1 className="font-display text-3xl font-bold text-ink">Log in</h1>
        <p className="mt-1 text-sm text-civic-600">Track your reports and check on the fixes near you.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm focus:border-civic-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-civic-300 px-3 py-2.5 text-sm focus:border-civic-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="rounded-sm bg-signal-red/10 px-3 py-2 text-sm text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-civic-800 px-4 py-3 font-semibold text-white hover:bg-civic-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-civic-600">
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-civic-800 underline">
            Register
          </Link>
        </p>

        <div className="mt-8 rounded-sm border border-civic-200 bg-civic-50 p-4 text-xs text-civic-600">
          <p className="mb-1 font-semibold text-civic-700">Demo accounts (after running the seed script)</p>
          <p>Resident: thabo@example.com / password123</p>
          <p>Municipal admin: admin@munifix.gov / password123</p>
        </div>
      </div>
    </div>
  );
}
