"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Sparkles, CheckCircle, Upload, User, Hospital, DollarSign, X, Paperclip } from "lucide-react";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

type Step = "details" | "generating" | "review" | "submitting" | "success";

interface SimpleClaimFormData {
  // Patient Basic Info
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientContact: string;

  // Clinical Information (Plain Language)
  chiefComplaint: string;
  problemDescription: string;
  symptomsDescription: string;
  howLongProblem: string;

  // Treatment Information (Plain Language)
  treatmentDescription: string;
  proceduresDescription: string;
  medicationsGiven: string;
  diagnosisInWords: string;

  // Admission Details
  admissionDate: string;
  dischargeDate: string;
  lengthOfStay: string;

  // Facilities & Services Provided (General)
  roomCategory: string;
  specialFacilities: string;
  servicesProvided: string;

  // Hospital Information
  departmentName: string;
  attendingDoctor: string;

  // Insurance & Billing (General)
  insuranceCompany: string;
  policyNumber: string;
  estimatedTotalCost: string;
}

interface GeneratedClaimReport {
  claimId: string;

  // AI Generated Technical Details
  technicalCodes: {
    icd10Codes: Array<{ code: string; description: string; confidence: number }>;
    cptCodes: Array<{ code: string; description: string; confidence: number }>;
    rxNormCodes: Array<{ code: string; description: string; confidence: number }>;
  };

  // Mapped Policy
  matchedPolicy: {
    policyId: string;
    policyName: string;
    coverageStatus: string;
    requirementsMet: string[];
  };

  // Clinical Summary (Technical)
  technicalDiagnosis: string;
  medicalNecessityJustification: string;

  // Billing Breakdown
  detailedBilling: {
    roomCharges: number;
    procedureCharges: number;
    medicationCharges: number;
    labCharges: number;
    otherCharges: number;
    totalAmount: number;
  };

  // Professional Documentation
  formalClaimLetter: string;
  supportingEvidence: string[];

  // Summary
  executiveSummary: string;
}

const EMPTY_FORM: SimpleClaimFormData = {
  patientName: "",
  patientAge: "",
  patientGender: "",
  patientContact: "",
  chiefComplaint: "",
  problemDescription: "",
  symptomsDescription: "",
  howLongProblem: "",
  treatmentDescription: "",
  proceduresDescription: "",
  medicationsGiven: "",
  diagnosisInWords: "",
  admissionDate: "",
  dischargeDate: "",
  lengthOfStay: "",
  roomCategory: "",
  specialFacilities: "",
  servicesProvided: "",
  departmentName: "",
  attendingDoctor: "",
  insuranceCompany: "",
  policyNumber: "",
  estimatedTotalCost: "",
};

export default function CreateClaimPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [formData, setFormData] = useState<SimpleClaimFormData>(EMPTY_FORM);
  const [generatedReport, setGeneratedReport] = useState<GeneratedClaimReport | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const updateForm = <K extends keyof SimpleClaimFormData>(key: K, value: SimpleClaimFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateReport = async () => {
    setStep("generating");

    // Simulate AI processing - in production, this calls the LLM API
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // AI generates all technical details from general descriptions
    const report: GeneratedClaimReport = generateTechnicalReport(formData);

    setGeneratedReport(report);
    setStep("review");
  };

  const handleApproveAndSubmit = async () => {
    setStep("submitting");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStep("success");
  };

  const handleEditAndRegenerate = () => {
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
            Your claim has been generated with all technical details, reviewed, and submitted to the insurance company.
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
                <div className="font-semibold text-slate-900">{formData.insuranceCompany}</div>
              </div>
              <div>
                <span className="text-slate-500">Amount:</span>
                <div className="font-semibold text-slate-900">${generatedReport?.detailedBilling.totalAmount.toLocaleString()}</div>
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
            }}>
              Create Another Claim
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link href="/claims" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft size={14} /> Back to Claims
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Create Insurance Claim</h1>
        <p className="mt-1 text-sm text-slate-500">
          Describe the patient's treatment in simple terms. Our AI will generate all technical codes and documentation.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <StepIndicator
            number={1}
            label="Describe Treatment"
            active={step === "details"}
            completed={step !== "details"}
          />
          <div className="flex-1 h-0.5 bg-slate-200 mx-4" />
          <StepIndicator
            number={2}
            label="AI Generates Details"
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

      {/* Step 1: Enter Simple Details */}
      {step === "details" && (
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleGenerateReport(); }}>
          <Alert type="info" title="No Technical Knowledge Required">
            Just describe the treatment in your own words. The AI will handle all medical codes, technical terms, and insurance documentation.
          </Alert>

          {/* Patient Information */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Patient Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Patient Name">
                <input
                  value={formData.patientName}
                  onChange={(e) => updateForm("patientName", e.target.value)}
                  placeholder="e.g., John Doe"
                  className="input"
                 
                />
              </FormField>
              <FormField label="Age">
                <input
                  type="number"
                  value={formData.patientAge}
                  onChange={(e) => updateForm("patientAge", e.target.value)}
                  placeholder="e.g., 65"
                  className="input"
                 
                />
              </FormField>
              <FormField label="Gender">
                <select
                  value={formData.patientGender}
                  onChange={(e) => updateForm("patientGender", e.target.value)}
                  className="input"
                 
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
              <FormField label="Contact Number">
                <input
                  value={formData.patientContact}
                  onChange={(e) => updateForm("patientContact", e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                  className="input"
                />
              </FormField>
            </div>
          </div>

          {/* Clinical Information (Plain Language) */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900">What Brought the Patient In?</h2>
              <span className="text-xs text-slate-500">(Describe in plain language)</span>
            </div>
            <div className="space-y-4">
              <FormField label="Main Complaint">
                <input
                  value={formData.chiefComplaint}
                  onChange={(e) => updateForm("chiefComplaint", e.target.value)}
                  placeholder="e.g., Severe knee pain"
                  className="input"
                 
                />
              </FormField>

              <FormField label="Describe the Problem" className="col-span-2">
                <textarea
                  value={formData.problemDescription}
                  onChange={(e) => updateForm("problemDescription", e.target.value)}
                  placeholder="e.g., Patient has severe arthritis in right knee. Bone grinding on bone. Can't walk properly or climb stairs."
                  className="input"
                  rows={3}
                 
                />
              </FormField>

              <FormField label="Symptoms">
                <textarea
                  value={formData.symptomsDescription}
                  onChange={(e) => updateForm("symptomsDescription", e.target.value)}
                  placeholder="e.g., Constant pain, swelling, stiffness, difficulty walking, can't sleep due to pain"
                  className="input"
                  rows={2}
                 
                />
              </FormField>

              <FormField label="How Long Has This Been a Problem?">
                <input
                  value={formData.howLongProblem}
                  onChange={(e) => updateForm("howLongProblem", e.target.value)}
                  placeholder="e.g., Over 2 years, getting worse"
                  className="input"
                 
                />
              </FormField>

              <FormField label="What Did We Diagnose?">
                <textarea
                  value={formData.diagnosisInWords}
                  onChange={(e) => updateForm("diagnosisInWords", e.target.value)}
                  placeholder="e.g., Severe wear and tear arthritis of the right knee with damaged cartilage"
                  className="input"
                  rows={2}
                 
                />
              </FormField>
            </div>
          </div>

          {/* Treatment Information */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Hospital size={20} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Treatment Provided</h2>
              <span className="text-xs text-slate-500">(What we did to help)</span>
            </div>
            <div className="space-y-4">
              <FormField label="Treatment Summary">
                <textarea
                  value={formData.treatmentDescription}
                  onChange={(e) => updateForm("treatmentDescription", e.target.value)}
                  placeholder="e.g., Patient tried physical therapy for 6 months but didn't improve. Replaced the damaged knee with an artificial one."
                  className="input"
                  rows={3}
                 
                />
              </FormField>

              <FormField label="Procedures/Surgery Performed">
                <textarea
                  value={formData.proceduresDescription}
                  onChange={(e) => updateForm("proceduresDescription", e.target.value)}
                  placeholder="e.g., Knee replacement surgery - removed damaged knee joint and put in artificial joint"
                  className="input"
                  rows={2}
                 
                />
              </FormField>

              <FormField label="Medications Given">
                <textarea
                  value={formData.medicationsGiven}
                  onChange={(e) => updateForm("medicationsGiven", e.target.value)}
                  placeholder="e.g., Pain medicine, blood thinner to prevent clots, anti-inflammatory medicine"
                  className="input"
                  rows={2}
                />
              </FormField>
            </div>
          </div>

          {/* Hospital Stay Details */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Hospital Stay Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Admission Date">
                <input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => updateForm("admissionDate", e.target.value)}
                  className="input"
                 
                />
              </FormField>
              <FormField label="Discharge Date">
                <input
                  type="date"
                  value={formData.dischargeDate}
                  onChange={(e) => updateForm("dischargeDate", e.target.value)}
                  className="input"
                 
                />
              </FormField>
              <FormField label="Total Days in Hospital">
                <input
                  type="number"
                  value={formData.lengthOfStay}
                  onChange={(e) => updateForm("lengthOfStay", e.target.value)}
                  placeholder="e.g., 4"
                  className="input"
                 
                />
              </FormField>
            </div>
          </div>

          {/* Facilities & Services */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Facilities & Services Used</h2>
            <div className="space-y-4">
              <FormField label="Room Type">
                <select
                  value={formData.roomCategory}
                  onChange={(e) => updateForm("roomCategory", e.target.value)}
                  className="input"
                 
                >
                  <option value="">Select...</option>
                  <option value="General Ward">General Ward (shared room)</option>
                  <option value="Semi-Private">Semi-Private (2 beds)</option>
                  <option value="Private">Private Room</option>
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="Deluxe">Deluxe Room</option>
                </select>
              </FormField>

              <FormField label="Special Facilities Used">
                <textarea
                  value={formData.specialFacilities}
                  onChange={(e) => updateForm("specialFacilities", e.target.value)}
                  placeholder="e.g., Operating theater, Recovery room, X-ray machine, MRI scanner"
                  className="input"
                  rows={2}
                />
              </FormField>

              <FormField label="Services Provided">
                <textarea
                  value={formData.servicesProvided}
                  onChange={(e) => updateForm("servicesProvided", e.target.value)}
                  placeholder="e.g., 24-hour nursing care, Physical therapy sessions, Meals, Doctor visits"
                  className="input"
                  rows={2}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Department">
                  <input
                    value={formData.departmentName}
                    onChange={(e) => updateForm("departmentName", e.target.value)}
                    placeholder="e.g., Orthopedics"
                    className="input"
                   
                  />
                </FormField>
                <FormField label="Attending Doctor">
                  <input
                    value={formData.attendingDoctor}
                    onChange={(e) => updateForm("attendingDoctor", e.target.value)}
                    placeholder="e.g., Dr. Sarah Mitchell"
                    className="input"
                   
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Insurance & Billing */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Insurance & Billing</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Insurance Company">
                <input
                  value={formData.insuranceCompany}
                  onChange={(e) => updateForm("insuranceCompany", e.target.value)}
                  placeholder="e.g., ABC Health Insurance"
                  className="input"
                 
                />
              </FormField>
              <FormField label="Policy Number">
                <input
                  value={formData.policyNumber}
                  onChange={(e) => updateForm("policyNumber", e.target.value)}
                  placeholder="e.g., ABC-POL-123456"
                  className="input"
                 
                />
              </FormField>
              <FormField label="Estimated Total Cost ($)" className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedTotalCost}
                  onChange={(e) => updateForm("estimatedTotalCost", e.target.value)}
                  placeholder="e.g., 48000"
                  className="input"
                 
                />
                <p className="mt-1 text-xs text-slate-500">AI will break this down into room, procedure, medication, and other charges</p>
              </FormField>
            </div>
          </div>

          {/* Document Upload */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Supporting Documents</h2>
              <span className="text-xs text-slate-500">(Bills, Prescriptions, Reports)</span>
            </div>

            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-6 py-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
              <Upload size={32} className="text-slate-400" />
              <div>
                <span className="text-sm font-medium text-slate-700">Click to upload files</span>
                <p className="text-xs text-slate-500 mt-1">PDF, Images, or Documents (Max 10MB each)</p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
            </label>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium text-slate-700">Uploaded Files ({uploadedFiles.length}):</div>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-700">{file.name}</span>
                      <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={<Sparkles size={18} />}
            >
              Generate Technical Claim Report
              <ArrowRight size={18} />
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: AI Generating */}
      {step === "generating" && (
        <div className="card p-12">
          <LoadingSpinner size={48} message="AI is generating your technical claim report..." />
          <div className="mt-6 space-y-2 text-center text-sm text-slate-600">
            <p>✓ Analyzing treatment description</p>
            <p>✓ Mapping to ICD-10 diagnosis codes</p>
            <p>✓ Mapping to CPT procedure codes</p>
            <p>✓ Identifying medication codes (RxNorm)</p>
            <p>✓ Matching insurance policy requirements</p>
            <p>✓ Breaking down billing charges</p>
            <p className="animate-pulse">● Generating formal documentation...</p>
          </div>
        </div>
      )}

      {/* Step 3: Review Generated Technical Report */}
      {step === "review" && generatedReport && (
        <div className="space-y-5">
          <Alert type="success" title="Technical Claim Report Generated">
            AI has generated all medical codes, technical documentation, and formal insurance submission letter. Review below and approve to submit.
          </Alert>

          {/* Executive Summary */}
          <div className="card p-5 bg-blue-50 border-2 border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Executive Summary</h2>
            <p className="text-sm text-blue-800 leading-relaxed">{generatedReport.executiveSummary}</p>
          </div>

          {/* Technical Medical Codes (AI Generated) */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">🔬 AI-Generated Medical Codes</h2>
            <p className="text-sm text-slate-600 mb-4">These standardized codes were automatically mapped from your description:</p>

            <div className="space-y-4">
              {generatedReport.technicalCodes.icd10Codes.length > 0 && (
                <CodeSection
                  title="ICD-10 Diagnosis Codes"
                  subtitle="What's wrong with the patient"
                  codes={generatedReport.technicalCodes.icd10Codes}
                />
              )}
              {generatedReport.technicalCodes.cptCodes.length > 0 && (
                <CodeSection
                  title="CPT Procedure Codes"
                  subtitle="What we did"
                  codes={generatedReport.technicalCodes.cptCodes}
                />
              )}
              {generatedReport.technicalCodes.rxNormCodes.length > 0 && (
                <CodeSection
                  title="RxNorm Medication Codes"
                  subtitle="Medicines given"
                  codes={generatedReport.technicalCodes.rxNormCodes}
                />
              )}
            </div>
          </div>

          {/* Policy Match */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">🏥 Insurance Policy Match</h2>
            <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-emerald-900 text-lg">{generatedReport.matchedPolicy.policyName}</div>
                  <div className="text-sm text-emerald-700">Policy ID: {generatedReport.matchedPolicy.policyId}</div>
                </div>
                <span className="badge badge-approved text-base">{generatedReport.matchedPolicy.coverageStatus}</span>
              </div>
              {generatedReport.matchedPolicy.requirementsMet.length > 0 && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <div className="text-xs font-semibold text-emerald-800 mb-2">Requirements Met:</div>
                  <ul className="space-y-1">
                    {generatedReport.matchedPolicy.requirementsMet.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-emerald-700">
                        <CheckCircle size={14} className="text-emerald-600" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Technical Diagnosis & Justification */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">🩺 Technical Medical Documentation</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Clinical Diagnosis (Technical):</h3>
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                  {generatedReport.technicalDiagnosis}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Medical Necessity Justification:</h3>
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                  {generatedReport.medicalNecessityJustification}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Billing Breakdown */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">💰 Detailed Billing Breakdown</h2>
            <p className="text-sm text-slate-600 mb-3">AI has categorized costs into standard billing categories:</p>

            <div className="space-y-2 text-sm">
              <BillingLine label="Room & Accommodation" amount={generatedReport.detailedBilling.roomCharges} />
              <BillingLine label="Procedures & Surgery" amount={generatedReport.detailedBilling.procedureCharges} />
              <BillingLine label="Medications & Pharmacy" amount={generatedReport.detailedBilling.medicationCharges} />
              <BillingLine label="Lab Tests & Diagnostics" amount={generatedReport.detailedBilling.labCharges} />
              <BillingLine label="Other Services" amount={generatedReport.detailedBilling.otherCharges} />
              <div className="pt-2 border-t-2 border-slate-300 mt-2">
                <BillingLine label="Total Claim Amount" amount={generatedReport.detailedBilling.totalAmount} bold />
              </div>
            </div>
          </div>

          {/* Formal Insurance Letter */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">📄 Formal Insurance Claim Letter</h2>
            <p className="text-sm text-slate-600 mb-3">Professional documentation ready for insurance submission:</p>

            <div className="bg-white rounded-lg p-6 border-2 border-slate-200">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                {generatedReport.formalClaimLetter}
              </pre>
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
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-600">Total Claim Amount</div>
                <div className="text-2xl font-bold text-slate-900">
                  ${generatedReport.detailedBilling.totalAmount.toLocaleString()}
                </div>
              </div>
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
        </div>
      )}

      {/* Step 4: Submitting */}
      {step === "submitting" && (
        <div className="card p-12">
          <LoadingSpinner size={48} message="Submitting claim to insurance company..." />
          <p className="mt-4 text-center text-sm text-slate-600">
            Your technical claim documentation is being securely transmitted...
          </p>
        </div>
      )}
    </div>
  );
}

// Helper Components
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
      <span className={`mt-2 text-xs font-medium text-center ${active || completed ? "text-slate-700" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

function FormField({ label,, className = "", children }: { label: string;?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function CodeSection({ title, subtitle, codes }: { title: string; subtitle?: string; codes: Array<{ code: string; description: string; confidence: number }> }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle && <div className="text-xs text-slate-600">{subtitle}</div>}
        </div>
      </div>
      <div className="space-y-2">
        {codes.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between bg-white rounded p-2 text-sm">
            <div className="flex-1">
              <span className="font-semibold text-slate-900">{item.code}</span>
              <span className="text-slate-600 ml-2">— {item.description}</span>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.confidence >= 0.9 ? "bg-emerald-100 text-emerald-700" : item.confidence >= 0.7 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
              {Math.round(item.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingLine({ label, amount, bold }: { label: string; amount: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span className="text-slate-700">{label}</span>
      <span className="text-slate-900">${amount.toLocaleString()}</span>
    </div>
  );
}

// AI Report Generation Logic
function generateTechnicalReport(formData: SimpleClaimFormData): GeneratedClaimReport {
  const problemLower = (formData.problemDescription + " " + formData.diagnosisInWords).toLowerCase();
  const procedureLower = formData.proceduresDescription.toLowerCase();

  // Intelligent code mapping based on description
  const icd10Codes = [];
  const cptCodes = [];
  const rxNormCodes = [];

  // ICD-10 Mapping Logic
  if (problemLower.includes("knee") && (problemLower.includes("arthritis") || problemLower.includes("wear") || problemLower.includes("cartilage"))) {
    icd10Codes.push({ code: "M17.11", description: "Unilateral primary osteoarthritis, right knee", confidence: 0.96 });
  } else if (problemLower.includes("diabetes")) {
    icd10Codes.push({ code: "E11.9", description: "Type 2 diabetes mellitus without complications", confidence: 0.94 });
  } else {
    icd10Codes.push({ code: "M25.50", description: "Pain in unspecified joint", confidence: 0.85 });
  }

  // CPT Mapping Logic
  if (procedureLower.includes("knee") && (procedureLower.includes("replacement") || procedureLower.includes("arthroplasty"))) {
    cptCodes.push({ code: "27447", description: "Total knee arthroplasty", confidence: 0.98 });
  } else if (procedureLower.includes("hip") && procedureLower.includes("replacement")) {
    cptCodes.push({ code: "27130", description: "Total hip arthroplasty", confidence: 0.97 });
  } else {
    cptCodes.push({ code: "99213", description: "Office or outpatient visit", confidence: 0.88 });
  }

  // RxNorm Mapping
  if (formData.medicationsGiven) {
    const medsLower = formData.medicationsGiven.toLowerCase();
    if (medsLower.includes("pain")) {
      rxNormCodes.push({ code: "1049621", description: "Oxycodone 5 MG Oral Tablet", confidence: 0.93 });
    }
    if (medsLower.includes("anti-inflammatory") || medsLower.includes("inflammation")) {
      rxNormCodes.push({ code: "203221", description: "Celecoxib 200 MG Oral Capsule", confidence: 0.91 });
    }
    if (medsLower.includes("blood thinner") || medsLower.includes("clot")) {
      rxNormCodes.push({ code: "854228", description: "Enoxaparin sodium 40 MG/0.4 ML Injection", confidence: 0.92 });
    }
  }

  // Calculate billing breakdown
  const totalAmount = parseFloat(formData.estimatedTotalCost) || 48000;
  const roomCharges = Math.round(totalAmount * 0.18);
  const procedureCharges = Math.round(totalAmount * 0.68);
  const medicationCharges = Math.round(totalAmount * 0.08);
  const labCharges = Math.round(totalAmount * 0.04);
  const otherCharges = totalAmount - (roomCharges + procedureCharges + medicationCharges + labCharges);

  const claimId = `CLM-${Date.now()}`;

  return {
    claimId,
    technicalCodes: {
      icd10Codes,
      cptCodes,
      rxNormCodes,
    },
    matchedPolicy: {
      policyId: "POL-KNEE-042",
      policyName: procedureLower.includes("knee") ? "Total Knee Arthroplasty Coverage" : "General Surgical Procedure Coverage",
      coverageStatus: "COVERED",
      requirementsMet: [
        "Medical necessity documented",
        "Diagnosis criteria satisfied",
        "Conservative treatment attempted",
        "Procedure medically appropriate",
      ],
    },
    technicalDiagnosis: generateTechnicalDiagnosis(formData),
    medicalNecessityJustification: generateMedicalNecessity(formData),
    detailedBilling: {
      roomCharges,
      procedureCharges,
      medicationCharges,
      labCharges,
      otherCharges,
      totalAmount,
    },
    formalClaimLetter: generateFormalLetter(formData, claimId, totalAmount, icd10Codes, cptCodes),
    supportingEvidence: [
      "Clinical notes documenting patient's condition",
      "Pre-operative assessment records",
      "Imaging studies showing severity",
      "Treatment history documentation",
      "Post-operative care plan",
    ],
    executiveSummary: `This claim is for ${formData.patientName}, a ${formData.patientAge}-year-old ${formData.patientGender.toLowerCase()} patient who presented with ${formData.chiefComplaint.toLowerCase()}. After comprehensive evaluation revealing ${formData.diagnosisInWords.toLowerCase()}, the patient underwent ${formData.proceduresDescription.toLowerCase()}. The procedure was medically necessary and appropriate, with all insurance policy requirements met. Total claim amount of $${totalAmount.toLocaleString()} includes all hospital services, procedure costs, medications, and associated care.`,
  };
}

function generateTechnicalDiagnosis(formData: SimpleClaimFormData): string {
  return `Clinical presentation consistent with ${formData.diagnosisInWords}. Patient exhibited ${formData.symptomsDescription.toLowerCase()} with symptom duration of ${formData.howLongProblem.toLowerCase()}. Clinical examination and diagnostic imaging confirmed the diagnosis requiring surgical intervention.`;
}

function generateMedicalNecessity(formData: SimpleClaimFormData): string {
  return `Medical necessity is established based on: (1) Documented diagnosis of ${formData.diagnosisInWords.toLowerCase()}, (2) Significant functional impairment as evidenced by ${formData.symptomsDescription.toLowerCase()}, (3) ${formData.treatmentDescription.toLowerCase()}, and (4) Clinical indication for surgical intervention. The proposed treatment represents the appropriate standard of care for this condition.`;
}

function generateFormalLetter(formData: SimpleClaimFormData, claimId: string, amount: number, icd10: any[], cpt: any[]): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return `CityCare Hospital
Medical Claims Department
${today}

${formData.insuranceCompany}
Claims Processing Department

RE: Insurance Claim Submission
Claim ID: ${claimId}
Patient: ${formData.patientName}, Age ${formData.patientAge}
Policy Number: ${formData.policyNumber}
Date of Service: ${formData.admissionDate} to ${formData.dischargeDate}

Dear Claims Adjudicator,

This letter serves as formal submission of an insurance claim for medical services rendered to the above-referenced patient.

CLINICAL SUMMARY:
The patient presented with ${formData.chiefComplaint.toLowerCase()}, with symptoms including ${formData.symptomsDescription.toLowerCase()}. Clinical evaluation revealed ${formData.diagnosisInWords.toLowerCase()}.

TREATMENT PROVIDED:
${formData.treatmentDescription}

PROCEDURE PERFORMED:
${formData.proceduresDescription}

The patient received care in our ${formData.departmentName} department under the supervision of ${formData.attendingDoctor}. Hospital stay duration was ${formData.lengthOfStay} days in a ${formData.roomCategory.toLowerCase()}.

DIAGNOSTIC CODES:
${icd10.map(c => `${c.code} - ${c.description}`).join("\n")}

PROCEDURE CODES:
${cpt.map(c => `${c.code} - ${c.description}`).join("\n")}

TOTAL CLAIM AMOUNT: $${amount.toLocaleString()}

Medical necessity for all services has been thoroughly documented. The treatment provided represents appropriate standard of care and is consistent with the patient's clinical presentation and diagnosis.

All supporting documentation, including clinical notes, diagnostic reports, and treatment records, is available upon request.

We respectfully request timely processing of this claim in accordance with policy terms and coverage provisions.

Sincerely,

CityCare Hospital
Medical Claims Department`;
}
