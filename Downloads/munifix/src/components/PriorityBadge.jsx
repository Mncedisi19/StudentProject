import { PRIORITY_CONFIG } from "@/lib/ui";

export default function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  return (
    <span
      className="stamp inline-flex items-center rounded-sm border px-2 py-1 text-[11px] font-semibold"
      style={{ color: cfg.color, borderColor: `${cfg.color}55` }}
    >
      {cfg.label}
    </span>
  );
}
