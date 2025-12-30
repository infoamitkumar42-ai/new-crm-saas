import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { logEvent } from "../supabaseClient";
import { UserRole } from "../types"; 
import { Users, Briefcase, ShieldCheck, FileSpreadsheet, Loader2, CheckCircle, XCircle } from "lucide-react";

// 🔗 APPS SCRIPT URL (Sheet Creator)
const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzTzo-Ep9I9_SzEbDJJXQeusZtkmawvXo3u6BZkkRPUaCI_CQYpNhUcDuBqBnj0f7KW/exec";

export const Auth: React.FC = () => {
  const { refreshProfile } = useAuth();
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
  // 📊 GOOGLE SHEET CREATOR (Fixed for CORS)
  // ═══════════════════════════════════════════════════════════
  
  const createUserSheet = async (userId: string, userEmail: string, userName: string): Promise<string | null> => {
    try {
      setStatusMessage("Creating your personal Google Sheet...");
      
      // Method 1: Using POST with text/plain to avoid CORS preflight
      const response = await fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'createSheet',
          userId: userId,
          email: userEmail,
          name: userName
        })
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const result = JSON.parse(text);
          if (result.success && result.sheetUrl) {
            console.log("✅ Sheet created:", result.sheetUrl);
            return result.sheetUrl;
          }
        } catch {
          console.log("Response:", text);
        }
      }

      // Method 2: Try GET request as fallback
      const getUrl = `${SHEET_CREATOR_URL}?action=createSheet&userId=${userId}&email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}`;
      
      const getResponse = await fetch(getUrl, { method: 'GET' });
      
      if (getResponse.ok) {
        const text = await getResponse.text();
        try {
          const result = JSON.parse(text);
          if (result.success && result.sheetUrl) {
            console.log("✅ Sheet created via GET:", result.sheetUrl);
            return result.sheetUrl;
          }
        } catch {
          console.log("GET Response:", text);
        }
      }

      console.log("Sheet creation will be handled by background job");
      return null;
      
    } catch (err) {
      console.error("Sheet creation error:", err);
      return null;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 FORM SUBMISSION
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
        // 🔍 MEMBER: Verify Team Code (Using RPC!)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (selectedRole === 'member') {
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

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔍 MANAGER: Verify Code is Available (Using RPC!)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (selectedRole === 'manager') {
          const isAvailable = await checkTeamCodeAvailability(teamCode);
          
          if (!isAvailable) {
            throw new Error("This Team Code is already taken. Please choose another.");
          }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 1. CREATE AUTH USER
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        setStatusMessage("Creating account...");
        
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name } }
        });

        if (authError) throw authError;
        const user = signUpData.user;
        if (!user) throw new Error("Signup failed. Please try again.");

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 2. CREATE GOOGLE SHEET (For Members Only)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let sheetUrl: string | null = null;
        
        if (selectedRole === 'member') {
          setStatusMessage("Creating your personal Lead Sheet...");
          sheetUrl = await createUserSheet(user.id, email, name);
          
          if (sheetUrl) {
            setStatusMessage("✅ Sheet created successfully!");
          } else {
            setStatusMessage("Sheet will be created shortly...");
          }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3. SAVE USER TO DATABASE
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        setStatusMessage("Saving profile...");
        
        const userData = {
          id: user.id,
          email: user.email,
          name: name || user.user_metadata?.name || '',
          role: selectedRole,
          team_code: selectedRole === 'manager' ? teamCode : null,
          manager_id: managerId,
          sheet_url: sheetUrl,
          payment_status: 'inactive',
          plan_name: 'none',
          daily_limit: 0,
          leads_today: 0,
          filters: { cities: [] },
          created_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase
          .from('users')
          .upsert(userData);

        if (dbError) {
          console.error("DB Error:", dbError);
          // User created in auth but DB failed - log for admin
          await logEvent('user_db_error', { 
            userId: user.id, 
            email, 
            error: dbError.message 
          });
        }

        await logEvent('user_signup_complete', { 
          email, 
          role: selectedRole, 
          hasSheet: !!sheetUrl,
          hasManager: !!managerId
        });
        
        setStatusMessage("Success! Opening dashboard...");
        await refreshProfile();
        
      } else {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // LOGIN LOGIC
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        setStatusMessage("Logging in...");
        
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) throw error;
        
        await refreshProfile();
      }
      
    } catch (err: any) {
      setError(err.message);
      
      // Cleanup on signup failure
      if (mode === "signup" && err.message.includes("Signup failed")) {
        await supabase.auth.signOut();
      }
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
