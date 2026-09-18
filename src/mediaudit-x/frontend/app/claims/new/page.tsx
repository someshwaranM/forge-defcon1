"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UploadCloud, X } from "lucide-react";
import { RejectedList, formatBytes, type Rejected } from "../../components/DocumentsPanel";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Mirrors ALLOWED_EXTENSIONS in backend app/pipeline/ingestion/models.py.
// The backend re-checks everything; this only saves a round trip.
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.tif,.tiff";

const DOC_TYPES = [
  ["supporting_document", "Supporting document"],
  ["referral_letter", "Referral letter"],
  ["op_note", "Operative note"],
  ["discharge_summary", "Discharge summary"],
  ["lab_report", "Lab report"],
  ["prescription", "Prescription"],
  ["imaging_report", "Imaging report"],
  ["other", "Other"],
] as const;

type FormState = {
  claim_id: string;
  patient_id: string;
  payer_name: string;
  claim_type: string;
  doc_type: string;
};

const EMPTY: FormState = {
  claim_id: "",
  patient_id: "",
  payer_name: "",
  claim_type: "professional",
  doc_type: "supporting_document",
};

export default function NewClaimPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState<Rejected[]>([]);
  const [createdClaimId, setCreatedClaimId] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRejected([]);

    if (!form.patient_id || !form.payer_name) {
      setError("Patient ID and payer are required.");
      return;
    }
    if (files.length === 0) {
      setError("Upload at least one document.");
      return;
    }

    const fd = new FormData();
    fd.append("patient_id", form.patient_id);
    fd.append("payer_name", form.payer_name);
    fd.append("claim_type", form.claim_type);
    fd.append("doc_type", form.doc_type);
    if (form.claim_id) fd.append("claim_id", form.claim_id);
    for (const file of files) fd.append("files", file);

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/claims/intake`, { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRejected(body.rejected || []);
        throw new Error(typeof body.detail === "string" ? body.detail : `Upload failed (${res.status})`);
      }

      const claimId: string = body.claim.claim_id;
      if (body.rejected?.length) {
        // Some files were refused: show why before moving on.
        setRejected(body.rejected);
        setCreatedClaimId(claimId);
        setSubmitting(false);
        return;
      }
      router.push(`/claims/${claimId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/claims" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} />
          Back to Claims
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Upload Claim Documents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload the hospital's documents. A draft claim is created from them; codes are filled in from the documents
          in the next steps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Patient ID" required>
            <input
              value={form.patient_id}
              onChange={(e) => update("patient_id", e.target.value)}
              placeholder="PAT-883910"
              className="input"
            />
          </Field>
          <Field label="Payer" required>
            <input
              value={form.payer_name}
              onChange={(e) => update("payer_name", e.target.value)}
              placeholder="UnitedHealthcare"
              className="input"
            />
          </Field>
          <Field label="Claim type">
            <select value={form.claim_type} onChange={(e) => update("claim_type", e.target.value)} className="input">
              <option value="professional">Professional</option>
              <option value="institutional">Institutional</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </Field>
          <Field label="Claim ID" hint="optional — auto-generated if left blank">
            <input
              value={form.claim_id}
              onChange={(e) => update("claim_id", e.target.value)}
              placeholder="CLM-1008"
              className="input"
            />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-600">
              Documents <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-slate-400">(PDF, PNG, JPG, TIFF · max 20 MB each)</span>
            </label>
            <select
              value={form.doc_type}
              onChange={(e) => update("doc_type", e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
            >
              {DOC_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center hover:border-blue-300 hover:bg-blue-50/40">
            <UploadCloud size={20} className="text-slate-400" />
            <span className="text-sm text-slate-500">Click to attach files</span>
            <input
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                >
                  <span>
                    {f.name} <span className="text-slate-400">· {formatBytes(f.size)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
        )}

        {rejected.length > 0 && <RejectedList rejected={rejected} />}

        {createdClaimId ? (
          <button
            type="button"
            onClick={() => router.push(`/claims/${createdClaimId}`)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Claim {createdClaimId} created — continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Uploading documents...
              </>
            ) : (
              "Upload documents & create claim"
            )}
          </button>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
