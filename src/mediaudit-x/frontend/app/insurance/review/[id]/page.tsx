"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Play, FileText, AlertCircle, CheckCircle } from "lucide-react";
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
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Claim Information</h2>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="bg-slate-50 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500 block mb-1">Patient</span>
            <div className="font-semibold text-slate-900">{claim.patient_id}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500 block mb-1">Payer</span>
            <div className="font-semibold text-slate-900">{claim.payer_name}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500 block mb-1">Procedure / Diagnosis Codes</span>
            <div className="font-semibold text-slate-900">
              <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs mr-2">
                CPT: {claim.cpt_code}
              </span>
              <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                ICD-10: {claim.icd10_code}
              </span>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <span className="text-xs font-medium text-emerald-600 block mb-1">Claim Amount</span>
            <div className="text-xl font-bold text-emerald-700">${claim.claim_amount?.toLocaleString()}</div>
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
            <div className="col-span-2 space-y-5">
              {/* AI Recommendation Card */}
              <AIRecommendationCard
                status={done.status}
                matchedPolicy={done.matched_policy}
                trajectoryResult={done.trajectory_result}
                evidenceCount={done.cited_evidence?.length || 0}
                interactionCount={alerts.length}
              />

              {/* Generated Decision Letter */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Generated Decision Letter</h2>
                    <p className="text-xs text-slate-500">AI-generated based on policy and evidence</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-5 border border-slate-200">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans">
                    {done.generated_letter}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right Column - Quick Stats */}
            <div className="space-y-4">
              {/* Evidence Summary */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Analysis Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Evidence Found</span>
                    <span className="text-sm font-bold text-blue-600">{done.cited_evidence?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Drug Interactions</span>
                    <span className="text-sm font-bold text-red-600">{alerts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Policy Matched</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {done.matched_policy ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`card p-5 border-2 ${
                done.status === "APPROVE" ? "border-emerald-200 bg-emerald-50" :
                done.status === "DENY" ? "border-red-200 bg-red-50" :
                "border-amber-200 bg-amber-50"
              }`}>
                <div className="text-xs font-medium text-slate-600 mb-2">AI Recommendation</div>
                <div className={`text-lg font-bold ${
                  done.status === "APPROVE" ? "text-emerald-700" :
                  done.status === "DENY" ? "text-red-700" :
                  "text-amber-700"
                }`}>
                  {done.status}
                </div>
              </div>
            </div>
          </div>

          {/* Drug Interaction Alerts */}
          {alerts.length > 0 && (
            <div className="card p-6 border-2 border-red-200 bg-red-50">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-red-900">Drug Interaction Findings</h3>
                  <p className="text-xs text-red-700 mt-1">{alerts.length} potential interaction(s) detected</p>
                </div>
              </div>
              <div className="space-y-3">
                {alerts.map((a, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        a.severity === "MAJOR" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {a.severity}
                      </span>
                    </div>
                    <div className="text-sm text-slate-800 mb-1">
                      <strong>{a.drug_a}</strong> + <strong>{a.drug_b}</strong>
                    </div>
                    <div className="text-xs text-slate-600">{a.mechanism}</div>
                    {a.fda_citation && (
                      <div className="text-xs text-slate-500 mt-2">
                        <span className="font-medium">Source:</span> {a.fda_citation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Policy */}
          {done.matched_policy && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Matched Policy</h2>
                  <p className="text-xs text-slate-500">Coverage policy identified for this claim</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200 p-5 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-1">
                      {done.matched_policy.title}
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="inline-block bg-white px-2 py-1 rounded font-mono text-xs">
                        {done.matched_policy.policy_id}
                      </span>
                    </div>
                  </div>
                  {done.matched_policy.step_therapy_required && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                      Step Therapy Required
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mb-2">
                  <strong className="text-slate-700">Payer:</strong> {done.matched_policy.payer_name}
                </div>
                <div className="text-sm text-slate-700 leading-relaxed bg-white/50 rounded p-3 border border-emerald-100">
                  <strong className="text-emerald-700 text-xs block mb-1">Clinical Indications:</strong>
                  {done.matched_policy.clinical_indications}
                </div>
              </div>

              {policyEvidence.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Supporting Evidence</h3>
                  <CitationPanel evidence={policyEvidence} />
                </div>
              )}
            </div>
          )}

          {/* Clinical Evidence */}
          {otherEvidence.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Clinical Evidence</h2>
                  <p className="text-xs text-slate-500">{otherEvidence.length} evidence item(s) found</p>
                </div>
              </div>
              <CitationPanel evidence={otherEvidence} />
            </div>
          )}

          {/* Decision Section */}
          <ReviewerDecisionPanel
            claimId={claim.claim_id}
            aiRecommendation={done.status}
            currentStatus={claim.status}
            reviewerComment={claim.reviewer_comment}
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
              setClaim((prev: any) => (prev ? { ...prev, status: result.status, reviewer_comment: comment } : prev));
            }}
          />
        </>
      )}
    </div>
  );
}
