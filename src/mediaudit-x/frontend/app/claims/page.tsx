"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "../components/StatusBadge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Claim = {
  id: string;
  claim_id: string;
  patient_id: string;
  payer_name: string;
  cpt_code: string;
  claim_amount: number;
  status: string;
};

const FILTERS = ["All", "PENDING", "APPROVED", "DENIED"] as const;

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    fetch(`${API_BASE_URL}/claims?limit=200`)
      .then((res) => res.json())
      .then((data) => {
        setClaims(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? claims : claims.filter((c) => c.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Claims</h1>
          <p className="mt-1 text-sm text-slate-500">{claims.length} claims on file</p>
        </div>
        <Link
          href="/claims/new"
          className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Claim
        </Link>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === f ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "All" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading claims...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No claims match this filter.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Claim ID</th>
                <th className="px-4 py-2.5 font-medium">Patient</th>
                <th className="px-4 py-2.5 font-medium">Payer</th>
                <th className="px-4 py-2.5 font-medium">CPT</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((claim) => (
                <tr key={claim.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{claim.claim_id}</td>
                  <td className="px-4 py-3 text-slate-500">{claim.patient_id}</td>
                  <td className="px-4 py-3 text-slate-500">{claim.payer_name}</td>
                  <td className="px-4 py-3 text-slate-500">{claim.cpt_code}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">${claim.claim_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/claims/${claim.claim_id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
