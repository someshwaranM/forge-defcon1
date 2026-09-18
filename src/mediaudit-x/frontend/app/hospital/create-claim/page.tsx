"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Sparkles, CheckCircle, Upload } from "lucide-react";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

type Step = "details" | "generating" | "review" | "submitting" | "success";

interface ClaimFormData {
  // Patient Information
  patientName: string;
  patientId: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;

  // Treatment Information
  admissionDate: string;
  dischargeDate: string;
  chiefComplaint: string;
  diagnosisDescription: string;
  treatmentProvided: string;
  proceduresPerformed: string;
  medicationsGiven: string;

  // Hospital & Facilities
  hospitalName: string;
  hospitalId: string;
  department: string;
  attendingPhysician: string;
  roomType: string;
  facilitiesProvided: string;

  // Insurance Information
  insuranceProvider: string;
  policyNumber: string;
  policyId: string;

  // Billing
  totalAmount: string;
  roomCharges: string;
  procedureCharges: string;
  medicationCharges: string;
  otherCharges: string;
}

interface GeneratedClaimReport {
  claimId: string;
  summary: string;
  standardizedCodes: {
    icd10Codes: Array<{ code: string; description: string; confidence: number }>;
    cptCodes: Array<{ code: string; description: string; confidence: number }>;
    rxNormCodes: Array<{ code: string; description: string; confidence: number }>;
  };
  policyMatch: {
    policyId: string;
    policyName: string;
    coverageStatus: string;
  };
  recommendedAmount: number;
  supportingEvidence: string[];
  generatedLetter: string;
}

const EMPTY_FORM: ClaimFormData = {
  patientName: "",
  patientId: "",
  dateOfBirth: "",
  gender: "",
  contactNumber: "",
  admissionDate: "",
  dischargeDate: "",
  chiefComplaint: "",
  diagnosisDescription: "",
  treatmentProvided: "",
  proceduresPerformed: "",
  medicationsGiven: "",
  hospitalName: "CityCare Hospital",
  hospitalId: "HOSP-001",
  department: "",
  attendingPhysician: "",
  roomType: "",
  facilitiesProvided: "",
  insuranceProvider: "",
  policyNumber: "",
  policyId: "",
  totalAmount: "",
  roomCharges: "",
  procedureCharges: "",
  medicationCharges: "",
  otherCharges: "",
};

export default function CreateClaimPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [formData, setFormData] = useState<ClaimFormData>(EMPTY_FORM);
  const [generatedReport, setGeneratedReport] = useState<GeneratedClaimReport | null>(null);
  const [editMode, setEditMode] = useState(false);

  const updateForm = <K extends keyof ClaimFormData>(key: K, value: ClaimFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateReport = async () => {
    setStep("generating");

    // Simulate LLM processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate the claim report
    const report: GeneratedClaimReport = {
      claimId: `CLM-${Date.now()}`,
      summary: generateClaimSummary(formData),
      standardizedCodes: generateStandardizedCodes(formData),
      policyMatch: {
        policyId: formData.policyId || "POL-KNEE-042",
        policyName: "Total Knee Replacement Coverage",
        coverageStatus: "COVERED",
      },
      recommendedAmount: parseFloat(formData.totalAmount) || 48000,
      supportingEvidence: [
        "Clinical notes documenting diagnosis",
        "Treatment records showing conservative therapy",
        "Imaging reports (MRI/X-Ray)",
        "Medication administration records",
        "Discharge summary",
      ],
      generatedLetter: generateFormalLetter(formData),
    };

    setGeneratedReport(report);
    setStep("review");
  };

  const handleApproveAndSubmit = async () => {
    setStep("submitting");

    // Simulate submission to insurance
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setStep("success");
  };

  const handleEditAndRegenerate = () => {
    setEditMode(true);
    setStep("details");
  };

  if (step === "success") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="card p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Claim Submitted Successfully!</h1>
          <p className="text-slate-600 mb-6">
            Your claim has been generated, reviewed, and submitted to the insurance company.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Claim ID:</span>
                <div className="font-semibold text-slate-900">{generatedReport?.claimId}</div>
              </div>
              <div>
                <span className="text-slate-500">Patient:</span>
                <div className="font-semibold text-slate-900">{formData.patientName}</div>
              </div>
              <div>
                <span className="text-slate-500">Insurance:</span>
                <div className="font-semibold text-slate-900">{formData.insuranceProvider}</div>
              </div>
              <div>
                <span className="text-slate-500">Amount:</span>
                <div className="font-semibold text-slate-900">${generatedReport?.recommendedAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/claims")}>
              View All Claims
            </Button>
            <Button variant="primary" onClick={() => {
              setStep("details");
              setFormData(EMPTY_FORM);
              setGeneratedReport(null);
              setEditMode(false);
            }}>
              Create Another Claim
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link href="/claims" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft size={14} /> Back to Claims
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Create New Claim</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter treatment details and generate a formatted claim report for insurance submission
        </p>
      </div>

      {/* Progress Steps */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <StepIndicator
            number={1}
            label="Enter Details"
            active={step === "details"}
            completed={step !== "details"}
          />
          <div className="flex-1 h-0.5 bg-slate-200 mx-4" />
          <StepIndicator
            number={2}
            label="Generate Report"
            active={step === "generating"}
            completed={step === "review" || step === "submitting" || step === "success"}
          />
          <div className="flex-1 h-0.5 bg-slate-200 mx-4" />
          <StepIndicator
            number={3}
            label="Review & Approve"
            active={step === "review"}
            completed={step === "submitting" || step === "success"}
          />
          <div className="flex-1 h-0.5 bg-slate-200 mx-4" />
          <StepIndicator
            number={4}
            label="Submit"
            active={step === "submitting"}
            completed={step === "success"}
          />
        </div>
      </div>

      {/* Step 1: Enter Details */}
      {step === "details" && (
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleGenerateReport(); }}>
          {/* Patient Information */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Patient Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Patient Name" required>
                <input
                  value={formData.patientName}
                  onChange={(e) => updateForm("patientName", e.target.value)}
                  placeholder="John Doe"
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Patient ID" required>
                <input
                  value={formData.patientId}
                  onChange={(e) => updateForm("patientId", e.target.value)}
                  placeholder="PAT-883910"
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Date of Birth" required>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Gender" required>
                <select
                  value={formData.gender}
                  onChange={(e) => updateForm("gender", e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
              <FormField label="Contact Number">
                <input
                  value={formData.contactNumber}
                  onChange={(e) => updateForm("contactNumber", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="input"
                />
              </FormField>
            </div>
          </div>

          {/* Treatment Information */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Treatment Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Admission Date" required>
                <input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => updateForm("admissionDate", e.target.value)}
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Discharge Date" required>
                <input
                  type="date"
                  value={formData.dischargeDate}
                  onChange={(e) => updateForm("dischargeDate", e.target.value)}
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Chief Complaint" className="col-span-2" required>
                <textarea
                  value={formData.chiefComplaint}
                  onChange={(e) => updateForm("chiefComplaint", e.target.value)}
                  placeholder="Patient's main complaint or reason for visit..."
                  className="input"
                  rows={2}
                  required
                />
              </FormField>
              <FormField label="Diagnosis Description" className="col-span-2" required>
                <textarea
                  value={formData.diagnosisDescription}
                  onChange={(e) => updateForm("diagnosisDescription", e.target.value)}
                  placeholder="Detailed diagnosis (e.g., Severe osteoarthritis of right knee, Grade 4 chondromalacia...)"
                  className="input"
                  rows={3}
                  required
                />
              </FormField>
              <FormField label="Treatment Provided" className="col-span-2" required>
                <textarea
                  value={formData.treatmentProvided}
                  onChange={(e) => updateForm("treatmentProvided", e.target.value)}
                  placeholder="Describe all treatments provided..."
                  className="input"
                  rows={3}
                  required
                />
              </FormField>
              <FormField label="Procedures Performed" className="col-span-2" required>
                <textarea
                  value={formData.proceduresPerformed}
                  onChange={(e) => updateForm("proceduresPerformed", e.target.value)}
                  placeholder="List all procedures (e.g., Total knee arthroplasty, right side...)"
                  className="input"
                  rows={2}
                  required
                />
              </FormField>
              <FormField label="Medications Given" className="col-span-2">
                <textarea
                  value={formData.medicationsGiven}
                  onChange={(e) => updateForm("medicationsGiven", e.target.value)}
                  placeholder="List medications with dosages..."
                  className="input"
                  rows={2}
                />
              </FormField>
            </div>
          </div>

          {/* Hospital & Facilities */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Hospital & Facilities</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Department" required>
                <input
                  value={formData.department}
                  onChange={(e) => updateForm("department", e.target.value)}
                  placeholder="Orthopedics"
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Attending Physician" required>
                <input
                  value={formData.attendingPhysician}
                  onChange={(e) => updateForm("attendingPhysician", e.target.value)}
                  placeholder="Dr. Smith"
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Room Type" required>
                <select
                  value={formData.roomType}
                  onChange={(e) => updateForm("roomType", e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select...</option>
                  <option value="General Ward">General Ward</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="Private">Private</option>
                  <option value="ICU">ICU</option>
                </select>
              </FormField>
              <FormField label="Facilities Provided" className="col-span-2">
                <textarea
                  value={formData.facilitiesProvided}
                  onChange={(e) => updateForm("facilitiesProvided", e.target.value)}
                  placeholder="Operating room, recovery room, physical therapy, nursing care..."
                  className="input"
                  rows={2}
                />
              </FormField>
            </div>
          </div>

          {/* Insurance & Billing */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Insurance & Billing</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Insurance Provider" required>
                <input
                  value={formData.insuranceProvider}
                  onChange={(e) => updateForm("insuranceProvider", e.target.value)}
                  placeholder="ABC Health Insurance"
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Policy Number" required>
                <input
                  value={formData.policyNumber}
                  onChange={(e) => updateForm("policyNumber", e.target.value)}
                  placeholder="POL-123456"
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Policy ID">
                <input
                  value={formData.policyId}
                  onChange={(e) => updateForm("policyId", e.target.value)}
                  placeholder="POL-KNEE-042"
                  className="input"
                />
              </FormField>
              <FormField label="Total Amount" required>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => updateForm("totalAmount", e.target.value)}
                  placeholder="48000"
                  className="input"
                  required
                />
              </FormField>
              <FormField label="Room Charges">
                <input
                  type="number"
                  step="0.01"
                  value={formData.roomCharges}
                  onChange={(e) => updateForm("roomCharges", e.target.value)}
                  placeholder="8000"
                  className="input"
                />
              </FormField>
              <FormField label="Procedure Charges">
                <input
                  type="number"
                  step="0.01"
                  value={formData.procedureCharges}
                  onChange={(e) => updateForm("procedureCharges", e.target.value)}
                  placeholder="35000"
                  className="input"
                />
              </FormField>
              <FormField label="Medication Charges">
                <input
                  type="number"
                  step="0.01"
                  value={formData.medicationCharges}
                  onChange={(e) => updateForm("medicationCharges", e.target.value)}
                  placeholder="3000"
                  className="input"
                />
              </FormField>
              <FormField label="Other Charges">
                <input
                  type="number"
                  step="0.01"
                  value={formData.otherCharges}
                  onChange={(e) => updateForm("otherCharges", e.target.value)}
                  placeholder="2000"
                  className="input"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={<Sparkles size={18} />}
            >
              Generate Claim Report with AI
              <ArrowRight size={18} />
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Generating */}
      {step === "generating" && (
        <div className="card p-12">
          <LoadingSpinner size={48} message="AI is generating your claim report..." />
          <div className="mt-6 space-y-2 text-center text-sm text-slate-600">
            <p>✓ Analyzing treatment details</p>
            <p>✓ Mapping to standardized medical codes</p>
            <p>✓ Matching against policy requirements</p>
            <p className="animate-pulse">● Generating formal claim letter...</p>
          </div>
        </div>
      )}

      {/* Step 3: Review Generated Report */}
      {step === "review" && generatedReport && (
        <div className="space-y-5">
          <Alert type="success" title="Claim Report Generated Successfully">
            Review the AI-generated claim report below. You can approve and submit it to the insurance company, or edit the details and regenerate.
          </Alert>

          {/* Generated Report Preview */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Generated Claim Report</h2>
              <span className="text-sm font-medium text-blue-600">{generatedReport.claimId}</span>
            </div>

            {/* Summary */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Claim Summary</h3>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
                {generatedReport.summary}
              </div>
            </div>

            {/* Standardized Codes */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Standardized Medical Codes</h3>
              <div className="space-y-3">
                {generatedReport.standardizedCodes.icd10Codes.length > 0 && (
                  <CodeSection
                    title="ICD-10 Diagnosis Codes"
                    codes={generatedReport.standardizedCodes.icd10Codes}
                  />
                )}
                {generatedReport.standardizedCodes.cptCodes.length > 0 && (
                  <CodeSection
                    title="CPT Procedure Codes"
                    codes={generatedReport.standardizedCodes.cptCodes}
                  />
                )}
                {generatedReport.standardizedCodes.rxNormCodes.length > 0 && (
                  <CodeSection
                    title="RxNorm Medication Codes"
                    codes={generatedReport.standardizedCodes.rxNormCodes}
                  />
                )}
              </div>
            </div>

            {/* Policy Match */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Policy Match</h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-blue-900">{generatedReport.policyMatch.policyName}</div>
                    <div className="text-sm text-blue-700">Policy ID: {generatedReport.policyMatch.policyId}</div>
                  </div>
                  <span className="badge badge-approved">{generatedReport.policyMatch.coverageStatus}</span>
                </div>
              </div>
            </div>

            {/* Recommended Amount */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Recommended Claim Amount</h3>
              <div className="text-2xl font-bold text-slate-900">
                ${generatedReport.recommendedAmount.toLocaleString()}
              </div>
            </div>

            {/* Formal Letter */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Formal Claim Letter</h3>
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                  {generatedReport.generatedLetter}
                </pre>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between card p-4">
            <Button
              variant="outline"
              onClick={handleEditAndRegenerate}
              icon={<FileText size={16} />}
            >
              Edit Details & Regenerate
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleApproveAndSubmit}
              icon={<CheckCircle size={18} />}
            >
              Approve & Submit to Insurance
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Submitting */}
      {step === "submitting" && (
        <div className="card p-12">
          <LoadingSpinner size={48} message="Submitting claim to insurance company..." />
          <p className="mt-4 text-center text-sm text-slate-600">
            Your claim is being securely transmitted...
          </p>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm ${
          completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : active
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-300 bg-white text-slate-400"
        }`}
      >
        {completed ? <CheckCircle size={20} /> : number}
      </div>
      <span className={`mt-2 text-xs font-medium ${active || completed ? "text-slate-700" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

function FormField({ label, required, className = "", children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function CodeSection({ title, codes }: { title: string; codes: Array<{ code: string; description: string; confidence: number }> }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="text-xs font-semibold text-slate-600 mb-2">{title}</div>
      <div className="space-y-1.5">
        {codes.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex-1">
              <span className="font-semibold text-slate-900">{item.code}</span>
              <span className="text-slate-600 ml-2">— {item.description}</span>
            </div>
            <span className={`text-xs font-medium ${item.confidence >= 0.9 ? "text-emerald-600" : item.confidence >= 0.7 ? "text-amber-600" : "text-red-600"}`}>
              {Math.round(item.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper functions for generating report content
function generateClaimSummary(data: ClaimFormData): string {
  return `Patient ${data.patientName} (${data.patientId}) was admitted to ${data.hospitalName} on ${data.admissionDate} with chief complaint of ${data.chiefComplaint}. Following comprehensive evaluation and treatment, the patient was diagnosed with ${data.diagnosisDescription}. Treatment included ${data.treatmentProvided}. The procedures performed were: ${data.proceduresPerformed}. Patient was discharged on ${data.dischargeDate} in stable condition.`;
}

function generateStandardizedCodes(data: ClaimFormData) {
  // Simple keyword matching for demo purposes
  const diagnosis = data.diagnosisDescription.toLowerCase();
  const procedure = data.proceduresPerformed.toLowerCase();
  const medications = data.medicationsGiven.toLowerCase();

  return {
    icd10Codes: [
      diagnosis.includes("knee") || diagnosis.includes("osteoarthritis")
        ? { code: "M17.11", description: "Unilateral primary osteoarthritis, right knee", confidence: 0.96 }
        : { code: "M25.50", description: "Pain in unspecified joint", confidence: 0.85 },
    ],
    cptCodes: [
      procedure.includes("knee") || procedure.includes("arthroplasty")
        ? { code: "27447", description: "Total knee arthroplasty", confidence: 0.98 }
        : { code: "99213", description: "Office visit", confidence: 0.90 },
    ],
    rxNormCodes: medications ? [
      { code: "860975", description: "Metformin hydrochloride 500 MG Oral Tablet", confidence: 0.94 },
    ] : [],
  };
}

function generateFormalLetter(data: ClaimFormData): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return `${data.hospitalName}
${data.hospitalId}
${today}

${data.insuranceProvider}
Claims Department

Re: Insurance Claim for Patient ${data.patientName}
Policy Number: ${data.policyNumber}
Patient ID: ${data.patientId}
Date of Service: ${data.admissionDate} to ${data.dischargeDate}

Dear Claims Adjudicator,

This letter serves as a formal claim submission for medical services provided to the above-referenced patient.

PATIENT INFORMATION:
Name: ${data.patientName}
Date of Birth: ${data.dateOfBirth}
Gender: ${data.gender}
Insurance Policy: ${data.policyNumber}

CLINICAL SUMMARY:
Chief Complaint: ${data.chiefComplaint}

Diagnosis: ${data.diagnosisDescription}

Treatment Provided: ${data.treatmentProvided}

Procedures Performed: ${data.proceduresPerformed}

${data.medicationsGiven ? `Medications Administered: ${data.medicationsGiven}` : ""}

The patient was treated in the ${data.department} department under the care of ${data.attendingPhysician}. ${data.roomType} accommodations were provided during the stay.

BILLING SUMMARY:
Total Claim Amount: $${parseFloat(data.totalAmount || "0").toLocaleString()}

The medical necessity for these services has been thoroughly documented. All treatments were provided in accordance with established clinical guidelines and standards of care. Supporting documentation, including clinical notes, diagnostic reports, and treatment records, is available upon request.

We respectfully request timely processing of this claim in accordance with the policy terms and conditions.

Should you require any additional information or documentation, please contact our billing department.

Sincerely,

${data.hospitalName}
Medical Records Department`;
}
