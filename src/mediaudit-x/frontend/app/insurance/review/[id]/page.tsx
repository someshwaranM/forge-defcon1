"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Play, FileText } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import AIRecommendationCard from "../../../components/claims/AIRecommendationCard";
import ReviewerDecisionPanel from "../../../components/claims/ReviewerDecisionPanel";
import CitationPanel from "../../../components/CitationPanel";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type InteractionAlertData = {
  severity: string;
  drug_a: string;
  drug_b: string;
  mechanism: string;
  fda_citation: string;
};

type DoneEvent = {
  status: string;
  adjudication_id: string;
  cited_evidence: any[];
  generated_letter: string;
  matched_policy?: any;
  trajectory_result?: any;
};

function parseSSEEvent(chunk: string): { event: string; data: string } | null {
  const lines = chunk.split("\n");
  let event = "message";
  let data = "";
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  return data ? { event, data } : null;
}

export default function InsuranceReviewPage() {
  const params = useParams();
  const claimId = params.id as string;

  const [claim, setClaim] = useState<any>(null);
  const [claimLoading, setClaimLoading] = useState(true);
  const [done, setDone] = useState<DoneEvent | null>(null);
  const [alerts, setAlerts] = useState<InteractionAlertData[]>([]);
  const [running, setRunning] = useState(false);
  const [checkedForExisting, setCheckedForExisting] = useState(false);

  // Real claim record.
  useEffect(() => {
    fetch(`${API_BASE_URL}/claims/${claimId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setClaim)
      .finally(() => setClaimLoading(false));
  }, [claimId]);

  // Any adjudication the agent already ran for this claim, so a reviewer
  // re-opening the page doesn't have to trigger a fresh run every time.
  useEffect(() => {
    fetch(`${API_BASE_URL}/claims/${claimId}/adjudications`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDone(data);
      })
      .finally(() => setCheckedForExisting(true));
  }, [claimId]);

  async function runAdjudication() {
    setRunning(true);
    setAlerts([]);

    const response = await fetch(`${API_BASE_URL}/claims/${claimId}/adjudicate`, { method: "POST" });
    if (!response.body) {
      setRunning(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const parsed = parseSSEEvent(chunk);
        if (!parsed) continue;
        const data = JSON.parse(parsed.data);

        if (parsed.event === "interaction_alert") {
          setAlerts((prev) => [...prev, data]);
        } else if (parsed.event === "done") {
          setDone(data);
        }
      }
    }
    setRunning(false);
  }

  const loading = claimLoading || !checkedForExisting;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Loading claim...</p>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">Claim not found</p>
        <Link href="/review-queue" className="mt-2 inline-block text-blue-600 hover:underline">
          Back to Review Queue
        </Link>
      </div>
    );
  }

  const policyEvidence = (done?.cited_evidence || []).filter((e: any) => e.source_index === "medical-policies");
  const otherEvidence = (done?.cited_evidence || []).filter((e: any) => e.source_index !== "medical-policies");

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <Link href="/review-queue" className="mb-2 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Back to Review Queue
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Claim Review</h1>
            <p className="mt-1 text-sm text-slate-500">Claim ID: {claim.claim_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <span className="text-sm text-slate-600">Submitted: {claim.submitted_date || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Claim Details */}
      <div className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Claim Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Patient:</span>
            <div className="font-semibold text-slate-900">{claim.patient_id}</div>
          </div>
          <div>
            <span className="text-slate-500">Payer:</span>
            <div className="font-semibold text-slate-900">{claim.payer_name}</div>
          </div>
          <div>
            <span className="text-slate-500">CPT / ICD-10:</span>
            <div className="font-semibold text-slate-900">
              {claim.cpt_code} / {claim.icd10_code}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Claim Amount:</span>
            <div className="font-semibold text-slate-900">${claim.claim_amount?.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {!done && (
        <div className="card flex items-center justify-between p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">No AI analysis yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Run the adjudication agent to get policy matching, patient-trajectory, and drug-interaction findings for this claim.
            </p>
          </div>
          <button
            onClick={runAdjudication}
            disabled={running}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              running ? "cursor-default bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Play size={15} />
            {running ? "Adjudicating..." : "Run AI Analysis"}
          </button>
        </div>
      )}

      {done && (
        <>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <div className="card p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FileText size={15} /> Generated Decision Letter
                </h2>
                <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                  {done.generated_letter}
                </pre>
              </div>
            </div>
            <div>
              <AIRecommendationCard
                status={done.status}
                matchedPolicy={done.matched_policy}
                trajectoryResult={done.trajectory_result}
                evidenceCount={done.cited_evidence?.length || 0}
                interactionCount={alerts.length}
              />
            </div>
          </div>

          {alerts.length > 0 && (
            <Alert type="error" title="Drug Interaction Findings">
              {alerts.map((a, i) => (
                <div key={i} className="mt-1 text-sm">
                  <strong>{a.severity}:</strong> {a.drug_a} + {a.drug_b} — {a.mechanism}
                </div>
              ))}
            </Alert>
          )}

          {done.matched_policy && (
            <div className="card p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Matched Policy</h2>
              <div className="mb-4 rounded-lg border border-slate-100 p-4 text-sm">
                <div className="font-medium text-slate-800">
                  {done.matched_policy.policy_id} — {done.matched_policy.title}
                </div>
                <div className="mt-1 text-slate-500">{done.matched_policy.payer_name}</div>
                <div className="mt-2 text-slate-600">{done.matched_policy.clinical_indications}</div>
                {done.matched_policy.step_therapy_required && (
                  <span className="badge badge-pending mt-2">Step therapy required</span>
                )}
              </div>
              {policyEvidence.length > 0 && <CitationPanel evidence={policyEvidence} />}
            </div>
          )}

          {otherEvidence.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Clinical Evidence</h2>
              <CitationPanel evidence={otherEvidence} />
            </div>
          )}

          {/* Decision Section */}
          <ReviewerDecisionPanel
            claimId={claim.claim_id}
            aiRecommendation={done.status}
            onDecisionSubmit={async (decision, comment) => {
              const res = await fetch(`${API_BASE_URL}/claims/${claim.claim_id}/decision`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  decision: decision === "APPROVED" ? "APPROVE" : decision === "DENIED" ? "DENY" : "REQUEST_INFO",
                  reviewer_comment: comment,
                }),
              });
              if (!res.ok) {
                throw new Error(`Failed to submit decision (${res.status})`);
              }
              const result = await res.json();
              setDone((prev) => (prev ? { ...prev, status: result.status } : prev));
              setClaim((prev: any) => (prev ? { ...prev, status: result.status } : prev));
            }}
          />
        </>
      )}
    </div>
  );
}
