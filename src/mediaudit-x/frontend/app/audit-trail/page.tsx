"use client";
import { ShieldCheck } from "lucide-react";
import ComingSoon from "../components/ComingSoon";

export default function AuditTrailPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900">Audit Trail</h1>
      <p className="text-sm text-slate-500">
        The hash-chained ledger itself is real and working (SHA-256, chained to the previous entry's hash —
        see <code className="rounded bg-slate-100 px-1">backend/app/tools/audit_ledger.py</code>) and gets a new
        entry every time you run adjudication. A dedicated UI to browse/verify the chain across all claims isn't
        built yet.
      </p>
      <ComingSoon
        icon={ShieldCheck}
        title="Ledger Browser"
        description="Browse every audit-ledger entry across all claims and re-run verify_chain() from the UI to prove tamper-evidence live."
      />
    </div>
  );
}
