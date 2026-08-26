import { STATUS_CONFIG } from "@/lib/ui";

export default function StatusBadge({ status, overdue }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="stamp inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-semibold"
        style={{ color: cfg.color, backgroundColor: cfg.bg }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
        {cfg.label}
      </span>
      {overdue && (
        <span className="stamp rounded-sm border border-signal-red/40 bg-signal-red/10 px-2 py-1 text-[11px] font-bold text-signal-red">
          Overdue
        </span>
      )}
    </span>
  );
}
