export const STATUS_CONFIG = {
  SUBMITTED: { label: "Submitted", color: "#C4432B", bg: "#FBE9E5", dot: "#C4432B" },
  ASSIGNED: { label: "Assigned", color: "#8A5A00", bg: "#FBF0DA", dot: "#D98E2B" },
  IN_PROGRESS: { label: "In Progress", color: "#8A5A00", bg: "#FBF0DA", dot: "#D98E2B" },
  RESOLVED: { label: "Resolved", color: "#1F6B45", bg: "#E4F3EA", dot: "#2E8B57" },
  CLOSED: { label: "Closed", color: "#1F6B45", bg: "#E4F3EA", dot: "#2E8B57" },
  REOPENED: { label: "Reopened", color: "#C4432B", bg: "#FBE9E5", dot: "#C4432B" },
};

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "#2C6188" },
  MEDIUM: { label: "Medium", color: "#8A5A00" },
  HIGH: { label: "High", color: "#C4432B" },
  CRITICAL: { label: "Critical", color: "#7A1F1F" },
};

export const CATEGORY_OPTIONS = [
  { value: "WATER", label: "Water & Sanitation" },
  { value: "ROADS", label: "Roads & Stormwater" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "WASTE", label: "Waste Management" },
  { value: "PARKS", label: "Parks & Public Spaces" },
  { value: "SAFETY", label: "Public Safety & Hazards" },
  { value: "OTHER", label: "Other / General" },
];

export const EMERGENCY_SERVICES = [
  { value: "POLICE", label: "Police", number: "10111" },
  { value: "AMBULANCE", label: "Ambulance", number: "10177" },
  { value: "FIRE", label: "Fire Brigade", number: "10177" },
  { value: "DISASTER_MANAGEMENT", label: "Disaster Management", number: "10111" },
];

export function mapPinColor(status) {
  if (status === "RESOLVED" || status === "CLOSED") return "#2E8B57";
  if (status === "ASSIGNED" || status === "IN_PROGRESS") return "#D98E2B";
  return "#C4432B";
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso.includes("Z") || iso.includes("+") ? iso : `${iso}Z`);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeUntil(iso) {
  if (!iso) return null;
  const target = new Date(iso.includes("Z") || iso.includes("+") ? iso : `${iso}Z`).getTime();
  const diffMs = target - Date.now();
  const abs = Math.abs(diffMs);
  const hours = Math.floor(abs / (1000 * 60 * 60));
  const mins = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  const label = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return diffMs >= 0 ? `${label} left` : `${label} overdue`;
}
