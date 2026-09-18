"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, FileText, Upload, User } from "lucide-react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type AuditEntry = {
  _id: string;
  ledger_id: string;
  claim_id: string;
  sequence_number: number;
  timestamp: string;
  record_hash: string;
  prev_hash: string;
  event_type?: string;
  adjudication_id?: string;
  ref_id?: string;
};

type AuditStats = {
  total_entries: number;
  unique_claims: number;
  event_types: Record<string, number>;
};

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);

  useEffect(() => {
    loadAuditTrail();
    loadStats();
  }, []);

  const loadAuditTrail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/audit/entries?limit=100`);
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err: any) {
      setError(err.message || "Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/audit/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  const verifyChain = async (claimId: string) => {
    setVerifying(claimId);
    try {
      const response = await fetch(`${API_BASE_URL}/audit/verify/${claimId}`);
      const data = await response.json();
      alert(data.message);
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getEventIcon = (eventType?: string) => {
    switch (eventType) {
      case "CLAIM_CREATED":
        return <FileText size={16} className="text-blue-600" />;
      case "DOCUMENT_UPLOADED":
        return <Upload size={16} className="text-purple-600" />;
      case "REVIEWER_DECISION":
        return <User size={16} className="text-emerald-600" />;
      default:
        return <ShieldCheck size={16} className="text-slate-600" />;
    }
  };

  const getEventColor = (eventType?: string) => {
    switch (eventType) {
      case "CLAIM_CREATED":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "DOCUMENT_UPLOADED":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "REVIEWER_DECISION":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  // Group entries by claim
  const uniqueClaims = Array.from(new Set(entries.map((e) => e.claim_id)));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Audit Trail</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hash-chained tamper-evident ledger of all claim events
          </p>
        </div>
        <Button onClick={loadAuditTrail} variant="outline" size="sm">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShieldCheck size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{stats.total_entries}</div>
                <div className="text-xs text-slate-500">Total Entries</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText size={20} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{stats.unique_claims}</div>
                <div className="text-xs text-slate-500">Claims Tracked</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Upload size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">
                  {stats.event_types["DOCUMENT_UPLOADED"] || 0}
                </div>
                <div className="text-xs text-slate-500">Documents</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <User size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">
                  {stats.event_types["REVIEWER_DECISION"] || 0}
                </div>
                <div className="text-xs text-slate-500">Decisions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Alert */}
      <Alert type="info">
        <div className="text-sm">
          <strong>How it works:</strong> Each entry's hash is computed from its payload + the
          previous entry's hash. Any modification to past entries breaks the entire chain, making
          tampering immediately detectable.
        </div>
      </Alert>

      {/* Error */}
      {error && (
        <Alert type="error" title="Failed to load audit trail">
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner message="Loading audit trail..." />}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <EmptyState
          icon={<ShieldCheck size={48} />}
          title="No audit entries yet"
          description="Audit entries will appear here as claims are created and adjudicated."
        />
      )}

      {/* Audit Entries */}
      {!loading && entries.length > 0 && (
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Events</h2>

          <div className="space-y-3">
            {entries.map((entry, idx) => (
              <div
                key={entry._id}
                className={`border rounded-lg p-4 transition-all ${getEventColor(entry.event_type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getEventIcon(entry.event_type)}
                      <span className="font-semibold text-sm">
                        {entry.event_type || "ADJUDICATION"}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                        Seq #{entry.sequence_number}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-slate-600">Claim ID:</span>
                        <div className="font-mono font-semibold">{entry.claim_id}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Timestamp:</span>
                        <div className="font-medium">{formatTimestamp(entry.timestamp)}</div>
                      </div>
                    </div>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-600 hover:text-slate-800 font-medium">
                        View Hash Details
                      </summary>
                      <div className="mt-2 space-y-1 bg-white/50 p-2 rounded border">
                        <div>
                          <span className="text-slate-600">Record Hash:</span>
                          <div className="font-mono text-[10px] break-all">
                            {entry.record_hash}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Previous Hash:</span>
                          <div className="font-mono text-[10px] break-all">
                            {entry.prev_hash}
                          </div>
                        </div>
                        {entry.adjudication_id && (
                          <div>
                            <span className="text-slate-600">Adjudication ID:</span>
                            <div className="font-mono text-[10px]">{entry.adjudication_id}</div>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>

                  {idx === 0 && (
                    <Button
                      onClick={() => verifyChain(entry.claim_id)}
                      variant="outline"
                      size="sm"
                      disabled={verifying === entry.claim_id}
                    >
                      {verifying === entry.claim_id ? "Verifying..." : "Verify Chain"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unique Claims */}
      {uniqueClaims.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Claims with Audit Entries ({uniqueClaims.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {uniqueClaims.map((claimId) => (
              <button
                key={claimId}
                onClick={() => verifyChain(claimId)}
                disabled={verifying === claimId}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono transition-colors disabled:opacity-50"
              >
                {claimId}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
