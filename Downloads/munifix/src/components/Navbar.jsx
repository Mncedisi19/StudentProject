"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { MapPin, LayoutDashboard, ShieldAlert, LogOut, Siren } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const linkClass = (href) =>
    `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
      pathname === href ? "bg-civic-800 text-paper" : "text-civic-200 hover:bg-civic-800/60 hover:text-paper"
    }`;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="bg-civic-900 border-b border-civic-700/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-signal-amber text-civic-900 font-display font-bold text-lg">
            M
          </span>
          <span className="font-display text-xl font-bold text-paper tracking-tight">MuniFix</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/map" className={linkClass("/map")}>
            <MapPin size={16} /> <span className="hidden sm:inline">Live Map</span>
          </Link>
          {user && user.role === "RESIDENT" && (
            <>
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                <LayoutDashboard size={16} /> <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link href="/emergency" className={linkClass("/emergency")}>
                <Siren size={16} /> <span className="hidden sm:inline">Emergency</span>
              </Link>
            </>
          )}
          {user && user.role === "MUNICIPAL_ADMIN" && (
            <Link href="/admin" className={linkClass("/admin")}>
              <ShieldAlert size={16} /> <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center gap-1.5 rounded-sm border border-civic-600 px-3 py-2 text-sm font-medium text-civic-200 hover:bg-civic-800/60 hover:text-paper"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-sm bg-signal-amber px-3 py-2 text-sm font-semibold text-civic-900 hover:bg-signal-amber/90"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
