import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { logEvent } from "../supabaseClient";
import { UserRole } from "../types"; 
import { 
  Users, Briefcase, ShieldCheck, FileSpreadsheet, Loader2, 
  CheckCircle, XCircle, AlertTriangle, Mail, ArrowLeft, KeyRound
} from "lucide-react";

// 🔗 APPS SCRIPT URL (Sheet Creator)
const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzTzo-Ep9I9_SzEbDJJXQeusZtkmawvXo3u6BZkkRPUaCI_CQYpNhUcDuBqBnj0f7KW/exec";

export const Auth: React.FC = () => {
  const { refreshProfile } = useAuth();
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODE: login | signup | forgot_password
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout>();

  // ═══════════════════════════════════════════════════════════
  // 🔐 FORGOT PASSWORD HANDLER
  // ═══════════════════════════════════════════════════════════
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error("Please enter a valid email address");
      }

      setStatusMessage("Sending reset link...");

      // Send password reset email via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      // Success
      setSuccessMessage(
        `✅ Password reset link sent to ${email}. Please check your inbox (and spam folder).`
      );
      
      // Log event
      await logEvent('password_reset_requested', { email }).catch(() => {});

    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🔍 TEAM CODE VERIFICATION (CASE-INSENSITIVE)
  // ═══════════════════════════════════════════════════════════
  
  const verifyTeamCode = async (code: string) => {
    const normalizedCode = code.toUpperCase().trim();
    
    if (!normalizedCode || normalizedCode.length < 3) {
      setTeamCodeStatus('idle');
      setManagerInfo(null);
      return;
    }

    setTeamCodeStatus('checking');

    try {
      const { data, error } = await supabase.rpc('verify_team_code', { 
        code: normalizedCode
      });

      console.log('Team code verification result:', { code: normalizedCode, data, error });

      if (error) {
        console.error('Team code verification error:', error);
        setTeamCodeStatus('invalid');
        setManagerInfo(null);
        return;
      }

      if (data && data.length > 0 && data[0].is_valid) {
        setTeamCodeStatus('valid');
        setManagerInfo({
          id: data[0].manager_id,
          name: data[0].manager_name || 'Manager'
        });
        console.log('✅ Valid team code! Manager:', data[0].manager_name);
      } else {
        setTeamCodeStatus('invalid');
        setManagerInfo(null);
        console.log('❌ Invalid team code');
      }

    } catch (err) {
      console.error('Team code check failed:', err);
      setTeamCodeStatus('invalid');
      setManagerInfo(null);
    }
  };

  const checkTeamCodeAvailability = async (code: string): Promise<boolean> => {
    const normalizedCode = code.toUpperCase().trim();
    
    if (!normalizedCode || normalizedCode.length < 3) return false;

    try {
      const { data, error } = await supabase.rpc('check_team_code_available', { 
        code: normalizedCode
      });

      console.log('Code availability check:', { code: normalizedCode, available: data, error });

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
    const upperValue = value.toUpperCase().replace(/\s/g, '').trim();
    setTeamCode(upperValue);
    setTeamCodeStatus('idle');
    setManagerInfo(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (selectedRole === 'member' && upperValue.length >= 3) {
      debounceRef.current = setTimeout(() => {
        verifyTeamCode(upperValue);
      }, 600);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 📊 GOOGLE SHEET CREATOR
  // ═══════════════════════════════════════════════════════════
  
  const createUserSheet = async (userId: string, userEmail: string, userName: string): Promise<string | null> => {
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setStatusMessage(`Creating Google Sheet (attempt ${attempt})...`);
        console.log(`📊 Sheet creation attempt ${attempt} for ${userEmail}`);
        
        const postResponse = await fetch(SHEET_CREATOR_URL, {
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

        if (postResponse.ok) {
          const text = await postResponse.text();
          console.log('POST Response:', text);
          
          try {
            const result = JSON.parse(text);
            if (result.success && result.sheetUrl) {
              console.log("✅ Sheet created via POST:", result.sheetUrl);
              return result.sheetUrl;
            }
            if (result.error) {
              console.error("Sheet creation error:", result.error);
            }
          } catch (parseErr) {
            console.log("Response not JSON:", text);
          }
        }

        // Fallback: GET request
        const getUrl = `${SHEET_CREATOR_URL}?action=createSheet&userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}`;
        
        console.log('Trying GET request...');
        const getResponse = await fetch(getUrl, { 
          method: 'GET',
          mode: 'cors'
        });
        
        if (getResponse.ok) {
          const text = await getResponse.text();
          console.log('GET Response:', text);
          
          try {
            const result = JSON.parse(text);
            if (result.success && result.sheetUrl) {
              console.log("✅ Sheet created via GET:", result.sheetUrl);
              return result.sheetUrl;
            }
          } catch (parseErr) {
            console.log("GET Response not JSON:", text);
          }
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (err) {
        console.error(`Sheet creation attempt ${attempt} error:`, err);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log("⚠️ Sheet creation failed after all retries");
    return null;
  };

  // ═══════════════════════════════════════════════════════════
  // 📝 FORM SUBMISSION (Login & Signup)
  // ═══════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    setStatusMessage("");

    try {
      if (mode === "signup") {
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // VALIDATION
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const normalizedTeamCode = teamCode.toUpperCase().trim();
        
        if (selectedRole === 'member' && !normalizedTeamCode) {
          throw new Error("Please enter a Team Code to join.");
        }
        if (selectedRole === 'manager' && !normalizedTeamCode) {
          throw new Error("Please create a unique Team Code for your team.");
        }
        if (normalizedTeamCode.length < 3) {
          throw new Error("Team Code must be at least 3 characters.");
        }

        setStatusMessage("Verifying details...");

        let managerId: string | null = null;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔍 MEMBER: Verify Team Code
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (selectedRole === 'member') {
          setStatusMessage("Verifying team code...");
          
          const { data, error: rpcError } = await supabase.rpc('verify_team_code', { 
            code: normalizedTeamCode 
          });

          console.log('Signup - Team code verification:', { code: normalizedTeamCode, data, error: rpcError });

          if (rpcError) {
            console.error('RPC Error:', rpcError);
            throw new Error("Unable to verify team code. Please try again.");
          }

          if (!data || data.length === 0 || !data[0].is_valid) {
            throw new Error(`Invalid Team Code: "${normalizedTeamCode}". Please ask your manager for the correct code.`);
          }

          managerId = data[0].manager_id;
          setStatusMessage(`Joining ${data[0].manager_name}'s team...`);
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔍 MANAGER: Verify Code is Available
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (selectedRole === 'manager') {
          setStatusMessage("Checking code availability...");
          
          const isAvailable = await checkTeamCodeAvailability(normalizedTeamCode);
          
          if (!isAvailable) {
            throw new Error(`Team Code "${normalizedTeamCode}" is already taken. Please choose another.`);
          }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 1. CREATE AUTH USER
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        setStatusMessage("Creating account...");
        
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { name: name.trim() } }
        });

        if (authError) {
          console.error('Auth Error:', authError);
          throw authError;
        }
        
        const user = signUpData.user;
        if (!user) throw new Error("Signup failed. Please try again.");

        console.log('✅ Auth user created:', user.id);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 2. CREATE GOOGLE SHEET (For Members Only)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let sheetUrl: string | null = null;
        
        if (selectedRole === 'member') {
          sheetUrl = await createUserSheet(user.id, email.trim(), name.trim());
          
          if (sheetUrl) {
            setStatusMessage("✅ Sheet created successfully!");
          } else {
            setStatusMessage("⚠️ Sheet will be created shortly...");
          }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3. SAVE USER TO DATABASE
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        setStatusMessage("Saving profile...");
        
        const userData = {
          id: user.id,
          email: user.email?.toLowerCase(),
          name: name.trim() || user.user_metadata?.name || 'New User',
          role: selectedRole,
          team_code: selectedRole === 'manager' ? normalizedTeamCode : null,
          manager_id: managerId,
          sheet_url: sheetUrl,
          payment_status: 'inactive',
          plan_name: 'none',
          plan_weight: 1,
          daily_limit: 0,
          leads_today: 0,
          total_leads_received: 0,
          filters: { pan_india: true, states: [], cities: [], gender: 'all' },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Saving user data:', userData);

        const { error: dbError } = await supabase
          .from('users')
          .upsert(userData);

        if (dbError) {
          console.error("DB Error:", dbError);
          await logEvent('user_db_error', { 
            userId: user.id, 
            email, 
            error: dbError.message 
          }).catch(() => {});
        } else {
          console.log('✅ User saved to database');
        }

        await logEvent('user_signup_complete', { 
          email, 
          role: selectedRole, 
          hasSheet: !!sheetUrl,
          hasManager: !!managerId,
          teamCode: selectedRole === 'manager' ? normalizedTeamCode : null
        }).catch(() => {});
        
        setStatusMessage("Success! Opening dashboard...");
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await refreshProfile();
        
      } else {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // LOGIN LOGIC
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        setStatusMessage("Logging in...");
        
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.trim().toLowerCase(), 
          password 
        });
        
        if (error) throw error;
        
        await refreshProfile();
      }
      
    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'An unexpected error occurred');
      
      if (mode === "signup") {
        try {
          await supabase.auth.signOut();
        } catch {}
      }
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // Reset form when mode changes
  const handleModeChange = (newMode: "login" | "signup" | "forgot_password") => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    setStatusMessage("");
    if (newMode !== "forgot_password") {
      setTeamCode("");
      setTeamCodeStatus('idle');
      setManagerInfo(null);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        {/* ━━━ FORGOT PASSWORD MODE ━━━ */}
        {mode === "forgot_password" ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <KeyRound size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Forgot Password?
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                No worries! Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleForgotPassword}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input 
                    className="w-full border border-slate-200 px-4 py-3 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="name@company.com" 
                    required 
                  />
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2 border border-green-200">
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2 border border-red-200">
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Status Message */}
              {statusMessage && (
                <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-blue-200">
                  <Loader2 size={18} className="animate-spin flex-shrink-0" />
                  {statusMessage}
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full font-bold py-3.5 rounded-xl text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button 
                className="flex items-center justify-center gap-2 mx-auto text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm transition-colors" 
                onClick={() => handleModeChange("login")}
              >
                <ArrowLeft size={16} />
                Back to Login
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ━━━ LOGIN / SIGNUP MODE ━━━ */}
            
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
                    className="w-full border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
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
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="name@company.com" 
                  required 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => handleModeChange("forgot_password")}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input 
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
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
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 space-y-5">
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
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          selectedRole === 'member' 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <Users size={24} className="mb-2" />
                        <span className="text-sm font-bold">Team Member</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole("manager");
                          setTeamCode("");
                          setTeamCodeStatus('idle');
                          setManagerInfo(null);
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          selectedRole === 'manager' 
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        <Briefcase size={24} className="mb-2" />
                        <span className="text-sm font-bold">Manager</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Input based on Role */}
                  <div>
                    {selectedRole === 'member' ? (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          Enter Team Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3 top-3 text-slate-400" size={18} />
                          <input 
                            className={`w-full border px-4 py-2.5 pl-10 pr-10 rounded-xl focus:ring-2 outline-none font-mono uppercase placeholder:normal-case transition-all text-lg tracking-wider ${
                              teamCodeStatus === 'valid' 
                                ? 'border-green-500 focus:ring-green-500 bg-green-50' 
                                : teamCodeStatus === 'invalid'
                                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            value={teamCode} 
                            onChange={e => handleTeamCodeChange(e.target.value)} 
                            placeholder="e.g. WIN11" 
                            required 
                            maxLength={20}
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
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1 bg-green-50 p-2 rounded-lg border border-green-200">
                            <CheckCircle size={14} />
                            <span>Joining <strong>{managerInfo.name}'s</strong> team</span>
                          </p>
                        )}
                        {teamCodeStatus === 'invalid' && (
                          <p className="text-xs text-red-600 mt-2 flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-200">
                            <XCircle size={14} />
                            <span>Invalid code. Ask your manager for the correct code.</span>
                          </p>
                        )}
                        {teamCodeStatus === 'idle' && teamCode.length === 0 && (
                          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
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
                            className="w-full border border-slate-200 px-4 py-2.5 pl-10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono uppercase placeholder:normal-case text-lg tracking-wider"
                            value={teamCode} 
                            onChange={e => setTeamCode(e.target.value.toUpperCase().replace(/\s/g, '').trim())} 
                            placeholder="e.g. WINNERS_CLUB" 
                            required 
                            minLength={3}
                            maxLength={20}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          💡 This code will be shared with your team members to join.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2 border border-red-200">
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Status Message */}
              {statusMessage && (
                <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-blue-200">
                  <Loader2 size={18} className="animate-spin flex-shrink-0" />
                  {statusMessage}
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading || (mode === 'signup' && selectedRole === 'member' && teamCodeStatus === 'checking')} 
                className={`w-full font-bold py-3.5 rounded-xl text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${
                  mode === 'signup' && selectedRole === 'manager' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
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
                ) : teamCodeStatus === 'valid' ? (
                  `Join ${managerInfo?.name || 'Team'}`
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
                  className="ml-2 font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors" 
                  onClick={() => handleModeChange(mode === "login" ? "signup" : "login")}
                >
                  {mode === "login" ? "Create Account" : "Login Here"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
