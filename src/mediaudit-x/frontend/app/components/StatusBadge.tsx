export default function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toUpperCase();
  const cls =
    normalized === "APPROVED"
      ? "badge-approved"
      : normalized === "DENIED"
      ? "badge-denied"
      : normalized === "REQUEST_INFO" || normalized === "PENDING"
      ? "badge-pending"
      : "badge-info";
  const label = normalized === "REQUEST_INFO" ? "Request Info" : normalized.charAt(0) + normalized.slice(1).toLowerCase();
  return <span className={`badge ${cls}`}>{label}</span>;
}
