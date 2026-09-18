"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, FileText, Clock } from "lucide-react";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/ui/Alert";
import Modal from "../../../components/ui/Modal";
import { DemoDataManager } from "../../../lib/completeDemoData";

const USE_DEMO_DATA = true;

interface AIAnalysisReport {
  recommendation: "APPROVE" | "DENY" | "REQUEST_INFO";
  summary: string;
  reasoning: {
    policyCompliance: string;
    medicalNecessity: string;
    patientHistory: string;
    riskFactors: string[];
  };
  policyDetails: {
    policyId: string;
    policyName: string;
    requirementsMet: Array<{ requirement: string; status: string; explanation: string }>;
  };
  claimDetails: {
    diagnosis: string;
    procedure: string;
    amount: number;
    provider: string;
  };
}

export default function InsuranceReviewPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const [claim, setClaim] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState<"APPROVE" | "DENY" | "REQUEST_INFO" | null>(null);
  const [reviewerComment, setReviewerComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (USE_DEMO_DATA) {
      const demoClaim = DemoDataManager.getClaim(claimId);
      if (demoClaim) {
        setClaim(demoClaim);

        // Automatically generate AI analysis when claim loads
        setTimeout(() => {
          const analysis = generateAIAnalysis(demoClaim);
          setAiAnalysis(analysis);
          setLoading(false);
        }, 1000);
      } else {
        setLoading(false);
      }
    }
  }, [claimId]);

  const handleMakeDecision = (selectedDecision: "APPROVE" | "DENY" | "REQUEST_INFO") => {
    setDecision(selectedDecision);
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!decision || !reviewerComment.trim()) return;

    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update claim status in demo data
    DemoDataManager.updateClaimStatus(claimId, decision === "APPROVE" ? "APPROVED" : decision === "DENY" ? "DENIED" : "REQUEST_INFO");

    setSubmitting(false);
    setShowDecisionModal(false);

    // Show success and redirect
    alert(`Claim ${decision === "APPROVE" ? "approved" : decision === "DENY" ? "denied" : "information requested"} successfully!`);
    router.push("/review-queue");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading claim and generating AI analysis...</p>
        </div>
      </div>
    );
  }

  if (!claim || !aiAnalysis) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">Claim not found</p>
        <Link href="/review-queue" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Review Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link href="/review-queue" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft size={14} /> Back to Review Queue
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Claim Review</h1>
            <p className="text-sm text-slate-500 mt-1">Claim ID: {claim.claim_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <span className="text-sm text-slate-600">Submitted: {claim.submitted_date}</span>
          </div>
        </div>
      </div>

      <Alert type="info" title="Automatic AI Analysis Complete">
        This claim has been automatically analyzed by our AI system. Review the analysis below and make your decision.
      </Alert>

      {/* Claim Details */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Claim Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Patient:</span>
            <div className="font-semibold text-slate-900">{claim.patient_name}</div>
          </div>
          <div>
            <span className="text-slate-500">Hospital:</span>
            <div className="font-semibold text-slate-900">{claim.hospital}</div>
          </div>
          <div>
            <span className="text-slate-500">Procedure:</span>
            <div className="font-semibold text-slate-900">{claim.procedure_name}</div>
          </div>
          <div>
            <span className="text-slate-500">Diagnosis:</span>
            <div className="font-semibold text-slate-900">{claim.diagnosis_description}</div>
          </div>
          <div>
            <span className="text-slate-500">Claim Amount:</span>
            <div className="font-semibold text-slate-900">${claim.claim_amount.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-slate-500">Insurance:</span>
            <div className="font-semibold text-slate-900">{claim.payer_name}</div>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className={`card border-2 p-6 ${
        aiAnalysis.recommendation === "APPROVE"
          ? "border-emerald-500 bg-emerald-50"
          : aiAnalysis.recommendation === "DENY"
          ? "border-red-500 bg-red-50"
          : "border-amber-500 bg-amber-50"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            aiAnalysis.recommendation === "APPROVE"
              ? "bg-emerald-100"
              : aiAnalysis.recommendation === "DENY"
              ? "bg-red-100"
              : "bg-amber-100"
          }`}>
            {aiAnalysis.recommendation === "APPROVE" ? (
              <CheckCircle size={32} className="text-emerald-600" />
            ) : aiAnalysis.recommendation === "DENY" ? (
              <XCircle size={32} className="text-red-600" />
            ) : (
              <AlertCircle size={32} className="text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 ${
              aiAnalysis.recommendation === "APPROVE"
                ? "text-emerald-900"
                : aiAnalysis.recommendation === "DENY"
                ? "text-red-900"
                : "text-amber-900"
            }">
              AI Recommendation: {aiAnalysis.recommendation === "APPROVE" ? "APPROVE CLAIM" : aiAnalysis.recommendation === "DENY" ? "DENY CLAIM" : "REQUEST MORE INFORMATION"}
            </h2>
            <p className={`text-sm leading-relaxed ${
              aiAnalysis.recommendation === "APPROVE"
                ? "text-emerald-800"
                : aiAnalysis.recommendation === "DENY"
                ? "text-red-800"
                : "text-amber-800"
            }`}>
              {aiAnalysis.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed AI Analysis */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">📋 Detailed Analysis</h2>

        <div className="space-y-5">
          {/* Policy Compliance */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <FileText size={16} />
              Policy Compliance
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
              {aiAnalysis.reasoning.policyCompliance}
            </div>
          </div>

          {/* Medical Necessity */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Medical Necessity</h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
              {aiAnalysis.reasoning.medicalNecessity}
            </div>
          </div>

          {/* Patient History */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Patient Medical History</h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
              {aiAnalysis.reasoning.patientHistory}
            </div>
          </div>

          {/* Risk Factors */}
          {aiAnalysis.reasoning.riskFactors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">⚠️ Risk Factors / Concerns</h3>
              <ul className="space-y-2">
                {aiAnalysis.reasoning.riskFactors.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-600">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Policy Requirements */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Policy Requirements Check</h2>
        <div className="mb-3 text-sm">
          <span className="text-slate-600">Policy:</span>
          <span className="font-semibold text-slate-900 ml-2">{aiAnalysis.policyDetails.policyName}</span>
          <span className="text-slate-500 ml-2">({aiAnalysis.policyDetails.policyId})</span>
        </div>

        <div className="space-y-3">
          {aiAnalysis.policyDetails.requirementsMet.map((req, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900 text-sm">{req.requirement}</span>
                <span className={`badge ${
                  req.status === "SATISFIED" ? "badge-approved" :
                  req.status === "NOT_SATISFIED" ? "badge-denied" :
                  req.status === "INSUFFICIENT_EVIDENCE" ? "badge-pending" :
                  "badge-info"
                }`}>
                  {req.status}
                </span>
              </div>
              <p className="text-sm text-slate-600">{req.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Section */}
      <div className="card p-6 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Your Decision</h2>
        <p className="text-sm text-slate-600 mb-5">
          Review the AI analysis above and make your final decision. Your decision will be recorded and cannot be changed.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleMakeDecision("APPROVE")}
            icon={<CheckCircle size={20} />}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Approve Claim
          </Button>

          <Button
            variant="danger"
            size="lg"
            onClick={() => handleMakeDecision("DENY")}
            icon={<XCircle size={20} />}
            className="w-full"
          >
            Deny Claim
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleMakeDecision("REQUEST_INFO")}
            icon={<AlertCircle size={20} />}
            className="w-full"
          >
            Request Info
          </Button>
        </div>
      </div>

      {/* Decision Modal */}
      <Modal
        open={showDecisionModal}
        onClose={() => !submitting && setShowDecisionModal(false)}
        title={`Confirm Decision: ${decision}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDecisionModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={decision === "APPROVE" ? "primary" : "danger"}
              onClick={handleSubmitDecision}
              loading={submitting}
              disabled={!reviewerComment.trim()}
            >
              Confirm {decision}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            type={decision === "APPROVE" ? "success" : decision === "DENY" ? "error" : "warning"}
            title="Final Decision"
          >
            You are about to <strong>{decision?.toLowerCase()}</strong> this claim. This action will be recorded in the audit trail.
          </Alert>

          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">Claim ID:</div>
            <div className="text-sm text-slate-600">{claim.claim_id}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">Patient:</div>
            <div className="text-sm text-slate-600">{claim.patient_name}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">AI Recommendation:</div>
            <div className="text-sm text-slate-600 font-semibold">{aiAnalysis?.recommendation}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewerComment}
              onChange={(e) => setReviewerComment(e.target.value)}
              placeholder="Explain your decision..."
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Required for audit trail</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Generate AI Analysis (in production this comes from backend)
function generateAIAnalysis(claim: any): AIAnalysisReport {
  // CLM-2026-00142: Approval case - Knee arthroplasty with full documentation
  if (claim.claim_id === "CLM-2026-00142") {
    return {
      recommendation: "APPROVE",
      summary: "This claim meets all policy requirements and medical necessity criteria. The patient has documented conservative treatment for 187 days (exceeding the 180-day requirement), imaging confirms severe degenerative changes, and the procedure is medically appropriate for the documented condition.",
      reasoning: {
        policyCompliance: "The claim satisfies all requirements under Policy POL-KNEE-042 (Total Knee Arthroplasty Coverage). Conservative treatment was documented for 187 days through physical therapy from January 12 to July 18, 2026, exceeding the mandatory 180-day requirement. The policy requires evidence of failed conservative management before surgical intervention, which is clearly documented.",
        medicalNecessity: "Medical necessity is well-established. The patient has severe osteoarthritis (ICD-10: M17.11) with Grade 4 chondromalacia confirmed by MRI performed on May 20, 2026. Clinical notes document significant functional impairment including inability to perform activities of daily living, persistent pain despite conservative management, and progressive deterioration of joint function. The total knee arthroplasty (CPT: 27447) is the appropriate standard of care for this severity of disease after failed conservative treatment.",
        patientHistory: "Patient is a 65-year-old with a 2+ year history of progressive right knee pain. Medical records show: Initial diagnosis on January 12, 2026; Completion of 5 documented physical therapy sessions over 187 days; MRI evidence of severe degenerative changes; No contraindications for surgery documented; Failed conservative management thoroughly documented. The patient's age, condition severity, and treatment history all support surgical intervention.",
        riskFactors: [],
      },
      policyDetails: {
        policyId: "POL-KNEE-042",
        policyName: "Total Knee Arthroplasty Coverage Policy",
        requirementsMet: [
          {
            requirement: "Diagnosis Documentation",
            status: "SATISFIED",
            explanation: "Diagnosis of osteoarthritis (ICD-10: M17.11) properly documented with clinical examination and imaging evidence."
          },
          {
            requirement: "Conservative Treatment (180 days minimum)",
            status: "SATISFIED",
            explanation: "187 days of physical therapy documented from 01/12/2026 to 07/18/2026, exceeding requirement."
          },
          {
            requirement: "Imaging Evidence",
            status: "SATISFIED",
            explanation: "MRI performed 05/20/2026 shows Grade 4 chondromalacia with severe degenerative changes."
          },
          {
            requirement: "Failed Conservative Treatment",
            status: "SATISFIED",
            explanation: "Clinical documentation demonstrates lack of improvement despite compliant conservative treatment."
          },
          {
            requirement: "Medical Necessity",
            status: "SATISFIED",
            explanation: "Procedure is medically necessary and appropriate for documented condition severity."
          },
        ],
      },
      claimDetails: {
        diagnosis: claim.diagnosis_description,
        procedure: claim.procedure_name,
        amount: claim.claim_amount,
        provider: claim.hospital,
      },
    };
  }

  // CLM-2026-00201: Emergency visit - Approval
  else if (claim.claim_id === "CLM-2026-00201") {
    return {
      recommendation: "APPROVE",
      summary: "This emergency department claim for acute myocardial infarction meets all coverage criteria. The high-complexity ED visit (CPT 99285) is appropriate for the acuity level, and all documentation supports medical necessity.",
      reasoning: {
        policyCompliance: "Claim satisfies Policy POL-EMRG-089 (Emergency Services Coverage). Emergency condition properly documented with diagnostic findings confirming acute myocardial infarction (I21.09). No pre-authorization required for emergency services per policy guidelines.",
        medicalNecessity: "Medical necessity clearly established. Patient presented with acute chest pain and diagnostic workup confirmed acute MI. Emergency intervention was appropriate and necessary. CPT 99285 (Emergency department visit, high complexity) is correctly coded for this level of acuity.",
        patientHistory: "Patient presented to ED with acute symptoms requiring immediate evaluation. Appropriate emergency diagnostics and treatment provided. Condition required high-complexity medical decision making.",
        riskFactors: [],
      },
      policyDetails: {
        policyId: "POL-EMRG-089",
        policyName: "Emergency Services Coverage",
        requirementsMet: [
          {
            requirement: "Emergency Condition",
            status: "SATISFIED",
            explanation: "Acute MI qualifies as life-threatening emergency condition."
          },
          {
            requirement: "Appropriate Level of Service",
            status: "SATISFIED",
            explanation: "CPT 99285 appropriate for documented acuity and complexity."
          },
          {
            requirement: "Medical Necessity",
            status: "SATISFIED",
            explanation: "Immediate intervention medically necessary for life-threatening condition."
          },
        ],
      },
      claimDetails: {
        diagnosis: claim.diagnosis_description,
        procedure: claim.procedure_name,
        amount: claim.claim_amount,
        provider: claim.hospital,
      },
    };
  }

  // CLM-2026-00198: GI Endoscopy - Request more info
  else if (claim.claim_id === "CLM-2026-00198") {
    return {
      recommendation: "REQUEST_INFO",
      summary: "Additional documentation required for this endoscopy claim. While the procedure is appropriate for GI hemorrhage, records do not clearly establish whether conservative measures were attempted first as required by policy.",
      reasoning: {
        policyCompliance: "Policy POL-ENDO-034 requires documentation of initial conservative management attempts before endoscopic intervention for non-emergent GI bleeding. Current records do not clearly indicate presentation severity or whether immediate endoscopy was emergently indicated versus electively scheduled.",
        medicalNecessity: "The diagnosis (K92.2 - Gastrointestinal hemorrhage, unspecified) and procedure (43239 - Upper GI endoscopy with biopsy) are clinically appropriate. However, medical necessity determination requires additional context about presentation severity, hemodynamic stability, and whether immediate intervention was required.",
        patientHistory: "Limited information available about onset, severity of bleeding, prior episodes, or failed conservative treatments. Additional records needed to establish clinical timeline and decision-making rationale.",
        riskFactors: [
          "Incomplete documentation of presentation severity",
          "No documentation of conservative treatment attempts",
          "Unable to determine if procedure was emergent versus elective",
        ],
      },
      policyDetails: {
        policyId: "POL-ENDO-034",
        policyName: "Endoscopy Procedures Policy",
        requirementsMet: [
          {
            requirement: "Diagnosis Documentation",
            status: "SATISFIED",
            explanation: "GI hemorrhage diagnosis properly documented."
          },
          {
            requirement: "Conservative Management Documentation",
            status: "INSUFFICIENT_EVIDENCE",
            explanation: "Records needed showing initial management approach and clinical decision-making."
          },
          {
            requirement: "Clinical Indication",
            status: "NEEDS_REVIEW",
            explanation: "Requires additional documentation to establish indication urgency."
          },
        ],
      },
      claimDetails: {
        diagnosis: claim.diagnosis_description,
        procedure: claim.procedure_name,
        amount: claim.claim_amount,
        provider: claim.hospital,
      },
    };
  }

  // CLM-2026-00175: Rotator cuff repair - Approval
  else if (claim.claim_id === "CLM-2026-00175") {
    return {
      recommendation: "APPROVE",
      summary: "This arthroscopic rotator cuff repair claim meets all policy requirements. Complete rotator cuff tear is documented with imaging, conservative treatment was attempted and failed, and surgical intervention is medically appropriate.",
      reasoning: {
        policyCompliance: "Claim satisfies Policy POL-ORTH-067 (Orthopedic Surgical Procedures). MRI documentation confirms complete rotator cuff tear (M75.120). Conservative treatment including physical therapy and injections attempted for appropriate duration before surgical intervention.",
        medicalNecessity: "Medical necessity is well-established. Complete rotator cuff tear documented on imaging with functional impairment. Failed conservative management including PT and corticosteroid injections. Arthroscopic repair (CPT 29826) is standard of care for complete tears with functional limitation.",
        patientHistory: "Patient with documented complete rotator cuff tear, right shoulder. Conservative treatment attempted with inadequate response. Appropriate candidate for surgical repair based on tear characteristics and functional status.",
        riskFactors: [],
      },
      policyDetails: {
        policyId: "POL-ORTH-067",
        policyName: "Orthopedic Surgical Procedures",
        requirementsMet: [
          {
            requirement: "Imaging Documentation",
            status: "SATISFIED",
            explanation: "MRI confirms complete rotator cuff tear."
          },
          {
            requirement: "Conservative Treatment",
            status: "SATISFIED",
            explanation: "PT and injections documented before surgical decision."
          },
          {
            requirement: "Medical Necessity",
            status: "SATISFIED",
            explanation: "Complete tear with failed conservative treatment warrants surgical repair."
          },
        ],
      },
      claimDetails: {
        diagnosis: claim.diagnosis_description,
        procedure: claim.procedure_name,
        amount: claim.claim_amount,
        provider: claim.hospital,
      },
    };
  }

  // CLM-2026-00156: Prostatectomy - Denial
  else if (claim.claim_id === "CLM-2026-00156") {
    return {
      recommendation: "DENY",
      summary: "This claim for radical prostatectomy must be denied due to lack of required pre-authorization. Policy POL-SURG-123 mandates pre-authorization for all major oncologic surgical procedures, and no authorization was obtained prior to the procedure.",
      reasoning: {
        policyCompliance: "The claim does NOT satisfy Policy POL-SURG-123 pre-authorization requirements. All non-emergent major oncologic surgical procedures require pre-authorization at least 5 business days prior to scheduled procedure. Our records show no pre-authorization request was submitted. This is a policy violation regardless of medical appropriateness.",
        medicalNecessity: "While the diagnosis of prostate cancer (C61) and the proposed radical prostatectomy may be medically appropriate, medical necessity cannot override mandatory pre-authorization requirements. The policy exists to ensure appropriate case review, coordinate care, and verify coverage eligibility before major procedures.",
        patientHistory: "Patient has diagnosis of malignant neoplasm of prostate. While this is a serious condition, it is not classified as an emergency that would waive pre-authorization requirements. Adequate time existed to obtain prior authorization before elective surgical scheduling.",
        riskFactors: [
          "No pre-authorization obtained (required per policy)",
          "Policy violation: POL-SURG-123 Section 4.2",
          "Procedure performed without required advance approval",
          "Provider responsibility to obtain authorization before scheduling",
        ],
      },
      policyDetails: {
        policyId: "POL-SURG-123",
        policyName: "Major Surgical Procedures Authorization Policy",
        requirementsMet: [
          {
            requirement: "Pre-Authorization",
            status: "NOT_SATISFIED",
            explanation: "No pre-authorization request submitted. Required 5+ business days before procedure."
          },
          {
            requirement: "Diagnosis Documentation",
            status: "SATISFIED",
            explanation: "Prostate cancer diagnosis documented."
          },
          {
            requirement: "Emergency Exemption",
            status: "NOT_SATISFIED",
            explanation: "Elective procedure does not qualify for emergency authorization waiver."
          },
        ],
      },
      claimDetails: {
        diagnosis: claim.diagnosis_description,
        procedure: claim.procedure_name,
        amount: claim.claim_amount,
        provider: claim.hospital,
      },
    };
  }

  // CLM-2026-00144: Insufficient evidence case (original second demo)
  else {
    return {
      recommendation: "REQUEST_INFO",
      summary: "This claim cannot be approved at this time due to insufficient documentation of conservative treatment. While the diagnosis and procedure are appropriate, the medical records show only 62 documented days of physical therapy, falling significantly short of the required 180-day conservative treatment period.",
      reasoning: {
        policyCompliance: "The claim does NOT satisfy Policy POL-KNEE-042 conservative treatment requirements. The policy mandates at least 180 continuous days of documented conservative treatment. Available records show: 36 days (March 15 - April 20), then an 81-day gap with no documentation (April 20 - July 10), then 26 days (July 10 - August 5). Total documented: 62 days vs. required 180 days.",
        medicalNecessity: "While the diagnosis of osteoarthritis and the proposed total knee arthroplasty are clinically appropriate, medical necessity cannot be established without proof of adequate conservative treatment attempts. The gap in treatment records from April 20 to July 10 (81 days) is not documented, making it impossible to verify continuous conservative management.",
        patientHistory: "Patient records are incomplete. The available timeline shows diagnosis on March 15, 2026, with physical therapy initiated the same day. However, the documentation has significant gaps that prevent verification of the required 180-day conservative treatment period. Records may exist for the gap period but have not been submitted.",
        riskFactors: [
          "Only 62 days of documented conservative treatment (118 days short of requirement)",
          "81-day gap in medical records cannot be verified",
          "Insufficient evidence of continuous treatment attempts",
          "Cannot establish failure of conservative management without complete documentation"
        ],
      },
      policyDetails: {
        policyId: "POL-KNEE-042",
        policyName: "Total Knee Arthroplasty Coverage Policy",
        requirementsMet: [
          {
            requirement: "Diagnosis Documentation",
            status: "SATISFIED",
            explanation: "Diagnosis of osteoarthritis properly documented."
          },
          {
            requirement: "Conservative Treatment (180 days minimum)",
            status: "INSUFFICIENT_EVIDENCE",
            explanation: "Only 62 days documented. Records needed for April 20 - July 10 period."
          },
          {
            requirement: "Treatment Duration",
            status: "INSUFFICIENT_EVIDENCE",
            explanation: "Cannot establish 180-day continuous period due to documentation gaps."
          },
          {
            requirement: "Imaging Evidence",
            status: "SATISFIED",
            explanation: "MRI documentation present showing degenerative changes."
          },
        ],
      },
      claimDetails: {
        diagnosis: claim.diagnosis_description,
        procedure: claim.procedure_name,
        amount: claim.claim_amount,
        provider: claim.hospital,
      },
    };
  }
}
