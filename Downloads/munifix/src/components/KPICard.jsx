export default function KPICard({ label, value, accent = "#193C57", suffix = "" }) {
  return (
    <div className="rounded-sm border border-civic-200 bg-white p-4">
      <p className="stamp text-[11px] font-semibold text-civic-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold" style={{ color: accent }}>
        {value}
        {suffix}
      </p>
    </div>
  );
}
