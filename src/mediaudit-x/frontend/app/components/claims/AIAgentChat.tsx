"use client";

import { useState } from "react";
import { Send, Sparkles, FileText, Bot, User } from "lucide-react";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: {
    id: string;
    type: string;
    description: string;
  }[];
  timestamp: Date;
}

interface AIAgentChatProps {
  claimId: string;
  isExpanded?: boolean;
}

// Suggested questions based on common review scenarios
const SUGGESTED_QUESTIONS = [
  "Was the conservative treatment requirement satisfied?",
  "Why is this claim recommended for approval/denial?",
  "What evidence supports the diagnosis?",
  "Are there any medication interaction concerns?",
  "Show me the patient's treatment timeline.",
  "Which policy requirement is uncertain?",
];

export default function AIAgentChat({ claimId, isExpanded = false }: AIAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (question?: string) => {
    const messageText = question || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getDemoResponse(messageText),
        citations: getDemoCitations(messageText),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`card flex flex-col ${isExpanded ? "h-[600px]" : "h-[500px]"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
          <Sparkles size={16} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">AI Claim Assistant</h3>
          <p className="text-xs text-slate-500">Ask questions about {claimId}</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">Connected</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot size={48} className="text-slate-300 mb-3" />
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Start a Conversation</h4>
            <p className="text-sm text-slate-500 mb-4 max-w-sm">
              Ask questions about this claim's evidence, policy requirements, or treatment timeline.
            </p>

            {/* Suggested Questions */}
            <div className="w-full max-w-md space-y-2">
              <p className="text-xs font-medium text-slate-600 mb-2">Suggested questions:</p>
              {SUGGESTED_QUESTIONS.slice(0, 3).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(question)}
                  className="w-full text-left text-xs text-slate-600 p-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Bot size={16} className="text-purple-600" />
                  </div>
                )}

                <div className={`flex flex-col ${message.role === "user" ? "items-end" : ""} max-w-[80%]`}>
                  <div
                    className={`rounded-lg px-4 py-2.5 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-slate-600">Evidence:</p>
                      {message.citations.map((citation) => (
                        <button
                          key={citation.id}
                          className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                        >
                          <FileText size={12} />
                          {citation.description}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="mt-1 text-xs text-slate-400">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {message.role === "user" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <User size={16} className="text-blue-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <Bot size={16} className="text-purple-600" />
                </div>
                <div className="bg-slate-100 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-slate-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this claim..."
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            icon={<Send size={16} />}
            variant="primary"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

// Demo responses (replace with actual API integration)
function getDemoResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("conservative treatment") || q.includes("treatment requirement")) {
    return `Yes. The available clinical records support the requirement.

**Why:**
The applicable policy requires at least 180 days of conservative treatment.

The patient timeline contains:
• Jan 12 — Physical therapy started
• Jul 18 — Physical therapy documented

Observed interval: 187 days

**Conclusion:**
Requirement: SATISFIED`;
  }

  if (q.includes("why") && (q.includes("approval") || q.includes("approve"))) {
    return `This claim is recommended for approval because the required policy criteria identified for this claim are supported by the available evidence.

**Verified:**
✓ Diagnosis requirement satisfied
✓ Conservative treatment documented
✓ Treatment duration requirement met
✓ Imaging evidence available

**Important:**
The recommendation remains advisory and requires final reviewer approval.`;
  }

  if (q.includes("medication") || q.includes("drug interaction")) {
    return `No relevant drug interactions were identified in the available interaction dataset for the medications reviewed.

**Note:**
This does not establish that the medications are universally safe for the patient. The reviewer should consider the complete clinical context.

**Medications checked:**
• Metformin 500mg
• Losartan 50mg

**Interaction database:**
FDA RxNorm interaction pairs`;
  }

  if (q.includes("evidence") || q.includes("diagnosis")) {
    return `The diagnosis is supported by clinical documentation and imaging evidence.

**Supporting evidence:**
• Clinical notes documenting osteoarthritis
• MRI report showing severe degeneration
• Physical examination findings
• Patient-reported symptoms

**ICD-10 Code:**
M17.11 - Unilateral primary osteoarthritis, right knee

**Confidence:**
High - Multiple corroborating sources`;
  }

  if (q.includes("timeline")) {
    return `The patient's treatment timeline shows the following key events:

**Jan 12, 2026** - Initial diagnosis of osteoarthritis
**Feb-Jul 2026** - Multiple physical therapy sessions (6 documented)
**May 20, 2026** - MRI performed, showing severe degeneration
**Aug 3, 2026** - Surgical intervention requested

**Duration of conservative treatment:**
187 days (exceeds 180-day requirement)

**View detailed timeline in the "Clinical History" tab.**`;
  }

  if (q.includes("policy") || q.includes("requirement") || q.includes("uncertain")) {
    return `Most policy requirements have been verified. One requirement needs attention:

**Satisfied requirements:**
✓ Diagnosis requirement
✓ Conservative treatment
✓ Treatment duration
✓ Failed conservative therapy documented

**Needs review:**
⚠️ MRI documentation - Document is attached but requires manual verification for specific findings.

**Recommendation:**
Review the MRI report in the "Policy & Guidelines" tab to confirm it meets the policy's imaging criteria.`;
  }

  // Default response
  return `I can help answer questions about this claim's evidence, policy requirements, treatment history, and medication safety.

Try asking:
• Was [specific requirement] satisfied?
• What evidence supports [aspect of claim]?
• Are there any concerns with [topic]?
• Show me details about [specific area]

How can I assist you with this claim?`;
}

function getDemoCitations(question: string): { id: string; type: string; description: string }[] {
  const q = question.toLowerCase();

  if (q.includes("treatment") || q.includes("requirement")) {
    return [
      { id: "EV-18291", type: "clinical_note", description: "PT note — Jan 12, 2026" },
      { id: "EV-19281", type: "clinical_note", description: "PT note — Jul 18, 2026" },
      { id: "POL-042-4.2", type: "policy", description: "Policy section 4.2: Conservative treatment requirement" },
    ];
  }

  if (q.includes("evidence") || q.includes("diagnosis")) {
    return [
      { id: "EV-12093", type: "clinical_note", description: "Clinical examination — Jan 12, 2026" },
      { id: "EV-15822", type: "imaging", description: "MRI report — May 20, 2026" },
      { id: "ICD-M17.11", type: "code", description: "ICD-10: M17.11" },
    ];
  }

  return [];
}
