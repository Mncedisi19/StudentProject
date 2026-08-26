"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Siren, Phone, Loader2, CheckCircle2, LocateFixed } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import { EMERGENCY_SERVICES } from "@/lib/ui";

export default function EmergencyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locError, setLocError] = useState("");
  const [logged, setLogged] = useState(null); // service value that was just logged

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("GPS not supported on this device.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Couldn't capture GPS location. You can still call the numbers below.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  async function handleLog(serviceType) {
    if (!location) return;
    try {
      await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: location.lat, longitude: location.lng, service_type: serviceType }),
      });
      setLogged(serviceType);
    } catch {
      // Logging failure shouldn't block someone from calling for help.
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
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3 rounded-sm bg-signal-red/10 p-4">
          <Siren className="text-signal-red" size={28} />
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Emergency assistance</h1>
            <p className="text-sm text-civic-600">
              Tap a service to log your location and see the number to call immediately.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-civic-600">
          {locating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Getting your GPS location…
            </>
          ) : location ? (
            <>
              <LocateFixed size={14} className="text-signal-green" />
              Location captured: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </>
          ) : (
            <span className="text-signal-amber">{locError}</span>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {EMERGENCY_SERVICES.map((s) => (
            <div key={s.value} className="rounded-sm border border-civic-200 bg-white p-5">
              <p className="font-display text-lg font-bold text-ink">{s.label}</p>
              <a
                href={`tel:${s.number}`}
                onClick={() => handleLog(s.value)}
                className="mt-3 flex items-center justify-center gap-2 rounded-sm bg-signal-red px-4 py-3 font-bold text-white hover:bg-signal-red/90"
              >
                <Phone size={18} /> Call {s.number}
              </a>
              {logged === s.value && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-signal-green">
                  <CheckCircle2 size={14} /> Logged to municipal emergency records.
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-civic-500">
          MuniFix logs the time and location of your tap for municipal disaster-response records. Always call
          the number directly for immediate help.
        </p>
      </div>
    </div>
  );
}
