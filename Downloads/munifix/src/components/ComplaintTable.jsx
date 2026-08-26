"use client";

import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { formatDate } from "@/lib/ui";

export default function ComplaintTable({ complaints, onSelect }) {
  if (complaints.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-civic-300 bg-white p-10 text-center text-civic-500">
        No complaints match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-civic-200 bg-white">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="stamp bg-civic-50 text-[11px] text-civic-500">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Reported</th>
            <th className="px-4 py-3">Me Too</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr
              key={c.id}
              onClick={() => onSelect(c)}
              className="cursor-pointer border-t border-civic-100 hover:bg-civic-50"
            >
              <td className="max-w-[220px] truncate px-4 py-3 font-medium text-ink">{c.title}</td>
              <td className="px-4 py-3 text-civic-600">{c.category}</td>
              <td className="px-4 py-3 text-civic-600">{c.assigned_department}</td>
              <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
              <td className="px-4 py-3"><StatusBadge status={c.status} overdue={c.is_overdue} /></td>
              <td className="px-4 py-3 whitespace-nowrap text-civic-500">{formatDate(c.created_at)}</td>
              <td className="px-4 py-3 text-civic-500">{c.me_too_count || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
