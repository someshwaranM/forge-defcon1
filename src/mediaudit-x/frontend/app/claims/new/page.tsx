"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, UploadCloud, X } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type FormState = {
  claim_id: string;
  patient_id: string;
  payer_name: string;
  cpt_code: string;
  icd10_code: string;
  claim_amount: string;
  claim_type: string;
};

const EMPTY: FormState = {
  claim_id: "",
  patient_id: "",
  payer_name: "",
  cpt_code: "",
  icd10_code: "",
  claim_amount: "",
  claim_type: "professional",
};

export default function NewClaimPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "creating" | "uploading">("idle");

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

    if (!form.patient_id || !form.payer_name || !form.cpt_code || !form.icd10_code || !form.claim_amount) {
      setError("Patient ID, payer, CPT code, ICD-10 code, and claim amount are all required.");
      return;
    }

    setSubmitting(true);
    setStep("creating");
    try {
      const res = await fetch(`${API_BASE_URL}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_id: form.claim_id || undefined,
          patient_id: form.patient_id,
          payer_name: form.payer_name,
          cpt_code: form.cpt_code,
          icd10_code: form.icd10_code,
          claim_amount: parseFloat(form.claim_amount),
          claim_type: form.claim_type,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to create claim (${res.status})`);
      }

      const created = await res.json();
      const claimId: string = created.claim_id;

      if (files.length > 0) {
        setStep("uploading");
        for (const file of files) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("doc_type", "supporting_document");
          const uploadRes = await fetch(`${API_BASE_URL}/claims/${claimId}/documents`, {
            method: "POST",
            body: fd,
          });
          if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => ({}));
            throw new Error(`Claim ${claimId} was created, but "${file.name}" failed to upload: ${body.detail || uploadRes.status}`);
          }
        }
      }

      router.push(`/claims/${claimId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
      setStep("idle");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/claims" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} />
          Back to Claims
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New Claim</h1>
        <p className="mt-1 text-sm text-slate-500">
          Creates a real claim in the system, ready to run through adjudication.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Claim ID" hint="optional — auto-generated if left blank">
            <input
              value={form.claim_id}
              onChange={(e) => update("claim_id", e.target.value)}
              placeholder="CLM-1008"
              className="input"
            />
          </Field>
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
            <select
              value={form.claim_type}
              onChange={(e) => update("claim_type", e.target.value)}
              className="input"
            >
              <option value="professional">Professional</option>
              <option value="institutional">Institutional</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </Field>
          <Field label="CPT code" required>
            <input
              value={form.cpt_code}
              onChange={(e) => update("cpt_code", e.target.value)}
              placeholder="27447"
              className="input"
            />
          </Field>
          <Field label="ICD-10 code" required>
            <input
              value={form.icd10_code}
              onChange={(e) => update("icd10_code", e.target.value)}
              placeholder="M17.11"
              className="input"
            />
          </Field>
          <Field label="Claim amount ($)" required>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.claim_amount}
              onChange={(e) => update("claim_amount", e.target.value)}
              placeholder="48000"
              className="input"
            />
          </Field>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Supporting documents <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center hover:border-blue-300 hover:bg-blue-50/40">
            <UploadCloud size={20} className="text-slate-400" />
            <span className="text-sm text-slate-500">Click to attach files, or drag them here</span>
            <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                  {f.name}
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              {step === "uploading" ? "Uploading documents..." : "Creating claim..."}
            </>
          ) : (
            "Create claim"
          )}
        </button>
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
