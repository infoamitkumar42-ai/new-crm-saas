// src/views/Auth.tsx

import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { logEvent } from "../supabaseClient";
import { UserRole } from "../types";
import { Users, Briefcase, ShieldCheck, FileSpreadsheet, Loader2, CheckCircle, XCircle, Mail, ArrowLeft } from "lucide-react";

export const Auth: React.FC = () => {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password">("login");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Team Code
  const [teamCode, setTeamCode] = useState("");
  const [teamCodeStatus, setTeamCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [managerInfo, setManagerInfo] = useState<{ id: string; name: string } | null>(null);

  const [selectedRole, setSelectedRole] = useState<UserRole>("member");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════
  // 🔍 TEAM CODE VERIFICATION
  // ═══════════════════════════════════════════════════════════

  const verifyTeamCode = async (code: string) => {
    if (!code || code.length < 3) {
      setTeamCodeStatus('idle');
      setManagerInfo(null);
      return;
    }

    setTeamCodeStatus('checking');

    try {
      // 1. Try RPC first
      const { data, error } = await supabase.rpc('verify_team_code', {
        code: code.toUpperCase()
      });

      if (!error && data && data.length > 0 && data[0].is_valid) {
        setTeamCodeStatus('valid');
        setManagerInfo({
          id: data[0].manager_id,
          name: data[0].manager_name || 'Manager'
        });
        return;
      }

      // 2. Fallback: Direct DB Query (if RPC fails/missing or code not found in RPC logic)
      // This helps if the SQL script wasn't run but public read access is allowed
      console.log("RPC verification failed or returned invalid, trying direct query...");
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_code', code.toUpperCase())
        .eq('role', 'manager')
        .maybeSingle();

      if (userData && !userError) {
        setTeamCodeStatus('valid');
        setManagerInfo({
          id: userData.id,
          name: userData.name || 'Manager'
        });
      } else {
        setTeamCodeStatus('invalid');
        setManagerInfo(null);
      }
    } catch (err) {
      console.error("Team code verification error:", err);
      setTeamCodeStatus('invalid');
      setManagerInfo(null);
    }
  };

  const checkTeamCodeAvailability = async (code: string): Promise<boolean> => {
    if (!code || code.length < 3) return false;

    try {
      // 1. Try RPC
      const { data, error } = await supabase.rpc('check_team_code_available', {
        code: code.toUpperCase()
      });

      if (!error) return data === true;

      // 2. Fallback: Direct DB Query
      const { data: existingUser, error: queryError } = await supabase
        .from('users')
        .select('id')
        .eq('team_code', code.toUpperCase())
        .maybeSingle();

      if (queryError) return false; // safest to assume not available on error
      return !existingUser;
    } catch {
      return false;
    }
  };

  const handleTeamCodeChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/\s/g, '');
    setTeamCode(upperValue);
    setTeamCodeStatus('idle');
    setManagerInfo(null);

    if (selectedRole === 'member' && upperValue.length >= 3) {
      setTimeout(() => {
        verifyTeamCode(upperValue);
      }, 500);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔑 FORGOT PASSWORD HANDLER
  // ═══════════════════════════════════════════════════════════

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectUrl}/reset-password`,
      });

      if (error) throw error;

      setSuccessMessage("Password reset link sent! Check your email inbox (also check spam folder).");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 FORM SUBMISSION (LOGIN / SIGNUP)
  // ═══════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    setStatusMessage("");

    try {
      if (mode === "signup") {

        if (selectedRole === 'member' && !teamCode) {
          throw new Error("Please enter a Team Code to join.");
        }
        if (selectedRole === 'manager' && !teamCode) {
          throw new Error("Please create a unique Team Code for your team.");
        }

        setStatusMessage("Verifying details...");

        let managerId: string | null = null;

        if (selectedRole === 'member') {
          if (teamCodeStatus === 'valid' && managerInfo) {
            managerId = managerInfo.id;
            setStatusMessage(`Joining ${managerInfo.name}'s team...`);
          } else {
            // 1. Try RPC first
            const { data: rpcData, error: rpcError } = await supabase.rpc('verify_team_code', {
              code: teamCode
            });

            let validManager = null;

            if (!rpcError && rpcData && rpcData.length > 0 && rpcData[0].is_valid) {
              validManager = { id: rpcData[0].manager_id, name: rpcData[0].manager_name };
            } else {
              // 2. Fallback: Direct Query
              console.log("RPC verify failed in submit, trying direct query...");
              const { data: userData } = await supabase
                .from('users')
                .select('id, name')
                .eq('team_code', teamCode)
                .eq('role', 'manager')
                .maybeSingle();

              if (userData) {
                validManager = { id: userData.id, name: userData.name };
              }
            }

            if (!validManager) {
              throw new Error("Invalid Team Code. Please ask your manager for the correct code (e.g. WINNERS).");
            }

            managerId = validManager.id;
            setStatusMessage(`Joining ${validManager.name || 'Manager'}'s team...`);
          }
        }

        if (selectedRole === 'manager') {
          const isAvailable = await checkTeamCodeAvailability(teamCode);

          if (!isAvailable) {
            throw new Error("This Team Code is already taken. Please choose another.");
          }
        }

        setStatusMessage("Creating account...");

        if (selectedRole === 'member') {
          await signUp({
            email: email.trim(),
            password,
            name: name.trim(),
            role: 'member',
            teamCode: teamCode.trim().toUpperCase(),
            managerId: managerId!
          });
        } else {
          await signUp({
            email: email.trim(),
            password,
            name: name.trim(),
            role: 'manager',
            teamCode: teamCode.trim().toUpperCase()
          });
        }

        await logEvent('user_signup_complete', {
          email,
          role: selectedRole,
          hasManager: !!managerId
        });

        setStatusMessage("Success! Opening dashboard...");

      } else {
        setStatusMessage("Logging in...");
        await signIn({ email, password });
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Join LeadFlow"}
            {mode === "forgot_password" && "Reset Password"}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            {mode === "login" && "Login to access your dashboard"}
            {mode === "signup" && "Start managing or working on leads today"}
            {mode === "forgot_password" && "We'll send you a reset link"}
          </p>
        </div>

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot_password" && (
          <form className="space-y-5" onSubmit={handleForgotPassword}>

            {successMessage && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <CheckCircle size={18} />
                {successMessage}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <XCircle size={18} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  className="w-full border px-4 py-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3.5 rounded-xl text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </form>
        )}

        {/* LOGIN / SIGNUP FORM */}
        {mode !== "forgot_password" && (
          <form className="space-y-5" onSubmit={handleSubmit}>

            {mode === "signup" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input
                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
              <input
                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {mode === "signup" && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("member");
                        setTeamCode("");
                        setTeamCodeStatus('idle');
                        setManagerInfo(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${selectedRole === 'member'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                    >
                      <Users size={20} className="mb-1" />
                      <span className="text-xs font-bold">Team Member</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("manager");
                        setTeamCode("");
                        setTeamCodeStatus('idle');
                        setManagerInfo(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${selectedRole === 'manager'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                    >
                      <Briefcase size={20} className="mb-1" />
                      <span className="text-xs font-bold">Manager</span>
                    </button>
                  </div>
                </div>

                <div>
                  {selectedRole === 'member' ? (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Enter Team Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          className={`w-full border px-4 py-2.5 pl-10 pr-10 rounded-lg focus:ring-2 outline-none font-mono uppercase placeholder:normal-case transition-all ${teamCodeStatus === 'valid'
                            ? 'border-green-500 focus:ring-green-500 bg-green-50'
                            : teamCodeStatus === 'invalid'
                              ? 'border-red-500 focus:ring-red-500 bg-red-50'
                              : 'focus:ring-blue-500'
                            }`}
                          value={teamCode}
                          onChange={e => handleTeamCodeChange(e.target.value)}
                          placeholder="e.g. WIN11"
                          required
                        />

                        <div className="absolute right-3 top-3">
                          {teamCodeStatus === 'checking' && (
                            <Loader2 size={18} className="text-blue-500 animate-spin" />
                          )}
                          {teamCodeStatus === 'valid' && (
                            <CheckCircle size={18} className="text-green-500" />
                          )}
                          {teamCodeStatus === 'invalid' && (
                            <XCircle size={18} className="text-red-500" />
                          )}
                        </div>
                      </div>

                      {teamCodeStatus === 'valid' && managerInfo && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle size={12} />
                          Joining {managerInfo.name}'s team
                        </p>
                      )}
                      {teamCodeStatus === 'invalid' && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <XCircle size={12} />
                          Invalid code. Ask your manager for the correct code.
                        </p>
                      )}
                      {teamCodeStatus === 'idle' && teamCode.length === 0 && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <FileSpreadsheet size={12} />
                          A personal Google Sheet will be created for you!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Create Your Team Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          className="w-full border px-4 py-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase placeholder:normal-case"
                          value={teamCode}
                          onChange={e => setTeamCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                          placeholder="e.g. WINNERS_CLUB"
                          required
                          minLength={3}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        This is the code your team members will use to join.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <XCircle size={18} />
                {error}
              </div>
            )}

            {statusMessage && (
              <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && selectedRole === 'member' && teamCodeStatus !== 'valid' && teamCode.length > 0)}
              className={`w-full font-bold py-3.5 rounded-xl text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${mode === 'signup' && selectedRole === 'manager'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </span>
              ) : mode === "login" ? (
                "Log In"
              ) : selectedRole === 'manager' ? (
                "Create Manager Account"
              ) : (
                "Join Team"
              )}
            </button>
          </form>
        )}

        {mode !== "forgot_password" && (
          <div className="mt-8 text-center space-y-6">
            <p className="text-slate-500 text-sm">
              {mode === "login" ? "New to LeadFlow?" : "Already have an account?"}
              <button
                type="button"
                className="ml-2 font-bold text-blue-600 hover:underline"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                  setSuccessMessage(null);
                  setTeamCode("");
                  setTeamCodeStatus('idle');
                  setManagerInfo(null);
                }}
              >
                {mode === "login" ? "Create Account" : "Login Here"}
              </button>
            </p>

            {/* ☢️ NUCLEAR RESET BUTTON (For stuck PWA users) */}
            <div className="pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-bold">App not working properly?</p>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm("This will clear all cache and repair the app. You will need to login again. Continue?")) {
                    // 🚀 LOG RESET ATTEMPT TO SENTRY
                    Sentry.captureMessage("User triggered Manual Repair & Reset", { level: "info" });

                    try {
                      // 1. Clear Caches
                      if ('caches' in window) {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(key => caches.delete(key)));
                      }
                      // 2. Clear Storage
                      localStorage.clear();
                      sessionStorage.clear();
                      // 3. Unregister SWs
                      if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        await Promise.all(registrations.map(r => r.unregister()));
                      }

                      Sentry.captureMessage("Manual Repair Success", { level: "info" });
                      window.location.href = window.location.origin + '/login?reset=done';
                    } catch (e: any) {
                      Sentry.captureException(e, { tags: { section: "repair_button" } });
                      window.location.reload();
                    }
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-red-500 transition-colors underline decoration-dotted underline-offset-4"
              >
                Click here to Repair & Reset App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
