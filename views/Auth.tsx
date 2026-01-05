// src/views/Auth.tsx

import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { logEvent } from "../supabaseClient";
import { UserRole } from "../types"; 
import { Users, Briefcase, ShieldCheck, FileSpreadsheet, Loader2, CheckCircle, XCircle } from "lucide-react";

// 🔗 APPS SCRIPT URL (Sheet Creator)
const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzTzo-Ep9I9_SzEbDJJXQeusZtkmawvXo3u6BZkkRPUaCI_CQYpNhUcDuBqBnj0f7KW/exec";

export const Auth: React.FC = () => {
  const { refreshProfile, signUp, signIn } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  
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

  // ═══════════════════════════════════════════════════════════
  // 🔍 TEAM CODE VERIFICATION (Using Secure RPC Function)
  // ═══════════════════════════════════════════════════════════
  
  const verifyTeamCode = async (code: string) => {
    if (!code || code.length < 3) {
      setTeamCodeStatus('idle');
      setManagerInfo(null);
      return;
    }

    setTeamCodeStatus('checking');

    try {
      // ✅ Use RPC function - works WITHOUT authentication!
      const { data, error } = await supabase.rpc('verify_team_code', { 
        code: code.toUpperCase() 
      });

      if (error) {
        console.error('Team code verification error:', error);
        setTeamCodeStatus('invalid');
        setManagerInfo(null);
        return;
      }

      // Check if valid
      if (data && data.length > 0 && data[0].is_valid) {
        setTeamCodeStatus('valid');
        setManagerInfo({
          id: data[0].manager_id,
          name: data[0].manager_name || 'Manager'
        });
      } else {
        setTeamCodeStatus('invalid');
        setManagerInfo(null);
      }

    } catch (err) {
      console.error('Team code check failed:', err);
      setTeamCodeStatus('invalid');
      setManagerInfo(null);
    }
  };

  const checkTeamCodeAvailability = async (code: string): Promise<boolean> => {
    if (!code || code.length < 3) return false;

    try {
      const { data, error } = await supabase.rpc('check_team_code_available', { 
        code: code.toUpperCase() 
      });

      if (error) {
        console.error('Code availability check error:', error);
        return false;
      }

      return data === true;

    } catch (err) {
      console.error('Code check failed:', err);
      return false;
    }
  };

  // Debounced team code check
  const handleTeamCodeChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/\s/g, '');
    setTeamCode(upperValue);
    setTeamCodeStatus('idle');
    setManagerInfo(null);

    // Debounce the verification
    if (selectedRole === 'member' && upperValue.length >= 3) {
      const timeoutId = setTimeout(() => {
        verifyTeamCode(upperValue);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 FORM SUBMISSION (FIXED!)
  // ═══════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStatusMessage("");

    try {
      if (mode === "signup") {
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // VALIDATION
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (selectedRole === 'member' && !teamCode) {
          throw new Error("Please enter a Team Code to join.");
        }
        if (selectedRole === 'manager' && !teamCode) {
          throw new Error("Please create a unique Team Code for your team.");
        }

        setStatusMessage("Verifying details...");

        let managerId: string | null = null;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔍 MEMBER: Verify Team Code
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (selectedRole === 'member') {
          // Use already verified managerInfo if available
          if (teamCodeStatus === 'valid' && managerInfo) {
            managerId = managerInfo.id;
            setStatusMessage(`Joining ${managerInfo.name}'s team...`);
          } else {
            // Re-verify if needed
            const { data, error: rpcError } = await supabase.rpc('verify_team_code', { 
              code: teamCode 
            });

            if (rpcError) {
              throw new Error("Unable to verify team code. Please try again.");
            }

            if (!data || data.length === 0 || !data[0].is_valid) {
              throw new Error("Invalid Team Code. Please ask your manager for the correct code.");
            }

            managerId = data[0].manager_id;
            setStatusMessage(`Joining ${data[0].manager_name}'s team...`);
          }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔍 MANAGER: Verify Code is Available
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (selectedRole === 'manager') {
          const isAvailable = await checkTeamCodeAvailability(teamCode);
          
          if (!isAvailable) {
            throw new Error("This Team Code is already taken. Please choose another.");
          }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ✅ USE signUp FROM useAuth (FIXED!)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        setStatusMessage("Creating account...");

        if (selectedRole === 'member') {
          // Member signup - pass managerId
          await signUp({
            email: email.trim(),
            password,
            name: name.trim(),
            role: 'member',
            teamCode: teamCode.trim().toUpperCase(),
            managerId: managerId!  // ← KEY FIX: Pass manager ID!
          });
        } else {
          // Manager signup - pass teamCode only
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
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // LOGIN LOGIC
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  // 🎨 RENDER (100% ORIGINAL - NO CHANGES!)
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {mode === "login" ? "Welcome Back" : "Join LeadFlow"}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            {mode === "login" ? "Login to access your dashboard" : "Start managing or working on leads today"}
          </p>
        </div>

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

          {/* Role & Team Code Section */}
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
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      selectedRole === 'member' 
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
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      selectedRole === 'manager' 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    <Briefcase size={20} className="mb-1" />
                    <span className="text-xs font-bold">Manager</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Input based on Role */}
              <div className="animate-fade-in-up">
                {selectedRole === 'member' ? (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Enter Team Code <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        className={`w-full border px-4 py-2.5 pl-10 pr-10 rounded-lg focus:ring-2 outline-none font-mono uppercase placeholder:normal-case transition-all ${
                          teamCodeStatus === 'valid' 
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
                      
                      {/* Status Icon */}
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
                    
                    {/* Status Message */}
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <XCircle size={18} />
              {error}
            </div>
          )}
          
          {/* Status Message */}
          {statusMessage && (
            <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {statusMessage}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading || (mode === 'signup' && selectedRole === 'member' && teamCodeStatus !== 'valid' && teamCode.length > 0)} 
            className={`w-full font-bold py-3.5 rounded-xl text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
              mode === 'signup' && selectedRole === 'manager' 
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

        {/* Mode Toggle */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            {mode === "login" ? "New to LeadFlow?" : "Already have an account?"}
            <button 
              className="ml-2 font-bold text-blue-600 hover:underline" 
              onClick={() => { 
                setMode(mode === "login" ? "signup" : "login"); 
                setError(null);
                setTeamCode("");
                setTeamCodeStatus('idle');
                setManagerInfo(null);
              }}
            >
              {mode === "login" ? "Create Account" : "Login Here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
