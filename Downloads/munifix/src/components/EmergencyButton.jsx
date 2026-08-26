import Link from "next/link";
import { Siren } from "lucide-react";

export default function EmergencyButton({ full = false }) {
  return (
    <Link
      href="/emergency"
      className={`flex items-center justify-center gap-2 rounded-sm bg-signal-red font-bold text-white shadow-sm transition-transform hover:scale-[1.01] hover:bg-signal-red/90 active:scale-[0.99] ${
        full ? "w-full px-4 py-4 text-lg" : "px-4 py-2.5 text-sm"
      }`}
    >
      <Siren size={full ? 22 : 16} />
      Emergency — Get Help Now
    </Link>
  );
}
