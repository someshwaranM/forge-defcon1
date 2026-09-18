"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Alert from "../ui/Alert";

interface ReviewerDecisionPanelProps {
  claimId: string;
  aiRecommendation?: string;
  onDecisionSubmit?: (decision: "APPROVED" | "DENIED" | "REQUEST_INFO", comment: string) => void;
}

export default function ReviewerDecisionPanel({
  claimId,
  aiRecommendation,
  onDecisionSubmit,
}: ReviewerDecisionPanelProps) {
  const [selectedDecision, setSelectedDecision] = useState<"APPROVED" | "DENIED" | "REQUEST_INFO" | null>(null);
  const [comment, setComment] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!selectedDecision || !comment.trim()) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedDecision || !comment.trim()) return;

    setSubmitting(true);
    try {
      // Call the API (mock for now)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onDecisionSubmit?.(selectedDecision, comment);
      setShowConfirm(false);
    } catch (error) {
      console.error("Failed to submit decision", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Final Reviewer Decision</h2>
        <p className="text-sm text-slate-600 mb-5">
          The AI recommendation is advisory. You are responsible for the final claim decision.
        </p>

        {/* AI Recommendation Display */}
        {aiRecommendation && (
          <div className="mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-600 mb-1">AI Recommendation:</div>
            <div className="text-sm font-semibold text-slate-800">{aiRecommendation}</div>
          </div>
        )}

        {/* Decision Options */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-3">Your Decision *</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedDecision("APPROVED")}
              className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                selectedDecision === "APPROVED"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <CheckCircle size={20} />
              <span className="font-medium">Approve Claim</span>
            </button>

            <button
              onClick={() => setSelectedDecision("DENIED")}
              className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                selectedDecision === "DENIED"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <XCircle size={20} />
              <span className="font-medium">Deny Claim</span>
            </button>

            <button
              onClick={() => setSelectedDecision("REQUEST_INFO")}
              className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                selectedDecision === "REQUEST_INFO"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <AlertCircle size={20} />
              <span className="font-medium">Request Info</span>
            </button>
          </div>
        </div>

        {/* Reviewer Comment */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reviewer Comment *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Explain the reason for your decision..."
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-xs text-slate-500">Required for auditability and transparency</p>
        </div>

        {/* Submit Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!selectedDecision || !comment.trim()}
          className="w-full"
        >
          Submit Decision
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={showConfirm}
        onClose={() => !submitting && setShowConfirm(false)}
        title="Confirm Decision"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowConfirm(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={selectedDecision === "APPROVED" ? "primary" : "danger"}
              onClick={handleConfirm}
              loading={submitting}
            >
              Confirm {selectedDecision === "APPROVED" ? "Approval" : selectedDecision === "DENIED" ? "Denial" : "Request"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert type={selectedDecision === "APPROVED" ? "success" : selectedDecision === "DENIED" ? "error" : "info"}>
            You are about to <strong>{selectedDecision?.toLowerCase()}</strong> this claim.
          </Alert>

          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">Claim ID:</div>
            <div className="text-sm text-slate-600">{claimId}</div>
          </div>

          {aiRecommendation && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">AI Recommendation:</div>
              <div className="text-sm text-slate-600">{aiRecommendation}</div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">Your Decision:</div>
            <div className="text-sm text-slate-600 font-semibold">{selectedDecision}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">Your Comment:</div>
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              {comment}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
