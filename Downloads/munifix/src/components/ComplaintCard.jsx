import Link from "next/link";
import { MapPin, ThumbsUp } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { formatDate } from "@/lib/ui";

export default function ComplaintCard({ complaint, href }) {
  const c = complaint;
  return (
    <Link
      href={href || `/complaints/${c.id}`}
      className="group flex gap-4 rounded-sm border border-civic-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-civic-100">
        {c.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-civic-400">
            <MapPin size={22} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-display text-base font-bold text-ink group-hover:underline">{c.title}</p>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-civic-600">{c.address || "Location pinned on map"}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={c.status} overdue={c.is_overdue} />
          <PriorityBadge priority={c.priority} />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-civic-500">
          <span>{formatDate(c.created_at)}</span>
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} /> {c.me_too_count || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
