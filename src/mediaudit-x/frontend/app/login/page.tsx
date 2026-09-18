"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Shield, ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";
import { useRole } from "../contexts/RoleContext";

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [selectedRole, setSelectedRole] = useState<"hospital" | "insurance" | null>(null);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!selectedRole || !credentials.username || !credentials.password) return;

    setLoggingIn(true);

    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set role and redirect to dashboard
    setRole(selectedRole);
    setLoggingIn(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4">
            M
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">MediAudit-X</h1>
          <p className="text-slate-600">AI-Powered Clinical Claims Intelligence Platform</p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hospital Portal */}
            <button
              onClick={() => setSelectedRole("hospital")}
              className="card p-8 text-left hover:shadow-xl hover:border-blue-300 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Building2 size={32} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Hospital Portal</h2>
                  <p className="text-slate-600 text-sm mb-4">
                    Create and submit insurance claims with AI-powered code generation
                  </p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      Create claims with plain language
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      Upload supporting documents
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      Generate technical reports
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-blue-600 font-medium">
                    Login as Hospital <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </button>

            {/* Insurance Portal */}
            <button
              onClick={() => setSelectedRole("insurance")}
              className="card p-8 text-left hover:shadow-xl hover:border-purple-300 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Shield size={32} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Insurance Portal</h2>
                  <p className="text-slate-600 text-sm mb-4">
                    Review claims with automatic AI analysis and policy verification
                  </p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                      Review submitted claims
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                      Automatic AI analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                      Approve or deny claims
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-purple-600 font-medium">
                    Login as Insurance <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* Login Form */
          <div className="max-w-md mx-auto">
            <div className="card p-8">
              <div className="text-center mb-6">
                <div className={`inline-flex p-4 rounded-xl mb-4 ${
                  selectedRole === "hospital" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                }`}>
                  {selectedRole === "hospital" ? <Building2 size={32} /> : <Shield size={32} />}
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedRole === "hospital" ? "Hospital Portal" : "Insurance Portal"} Login
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Enter your credentials to continue
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={selectedRole === "hospital" ? "hospital" : "insurance"}
                    className="input"
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    className="input"
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                  <strong>Demo Credentials:</strong><br/>
                  Username: {selectedRole}<br/>
                  Password: demo
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleLogin}
                  loading={loggingIn}
                  disabled={!credentials.username || !credentials.password}
                  className="w-full"
                  icon={<ArrowRight size={18} />}
                >
                  Login to {selectedRole === "hospital" ? "Hospital" : "Insurance"} Portal
                </Button>

                <button
                  onClick={() => {
                    setSelectedRole(null);
                    setCredentials({ username: "", password: "" });
                  }}
                  className="w-full text-sm text-slate-600 hover:text-slate-900"
                >
                  ← Back to portal selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>Secure • Encrypted • HIPAA Compliant</p>
        </div>
      </div>
    </div>
  );
}
