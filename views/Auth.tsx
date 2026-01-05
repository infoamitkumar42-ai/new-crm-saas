// src/views/Auth.tsx

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { UserRole } from "../types"; 
import { 
  Users, Briefcase, ShieldCheck, FileSpreadsheet, Loader2, 
  CheckCircle, XCircle, AlertTriangle, Mail, ArrowLeft, KeyRound,
  Eye, EyeOff
} from "lucide-react";

// 🔗 APPS SCRIPT URL (Sheet Creator)
const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzLDTaYagAacas6-Jy5nLSpLv8hVzCrlIC-dZ7l-zWso8suYeFzajrQLnyBA_X9gVs4/exec";

export const Auth: React.FC = () => {
  const { signUp, signIn } = useAuth();
  
  const [mode, setMode] = useState<"login" | "signup" | "forgot_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Team Code State
  const [teamCode, setTeamCode] = useState(""); 
  const [teamCodeStatus, setTeamCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [managerInfo, setManagerInfo] = useState<{ id: string; name: string } | null>(null);
  
  const [selectedRole, setSelectedRole] = useState<UserRole>("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout>();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 VERIFY TEAM CODE (For Members)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const verifyTeamCode = async (code: string) => {
    if (!code || code.length < 3) {
      setTeamCodeStatus('idle');
      setManagerInfo(null);
      return;
    }

    setTeamCodeStatus('checking');
    
    try {
      const normalizedCode = code.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('team_code', normalizedCode)
        .eq('role', 'manager')
        .maybeSingle();

      if (error) {
        console.error("Team code lookup error:", error);
        setTeamCodeStatus('invalid');
        setManagerInfo(null);
        return;
      }

      if (data) {
        setTeamCodeStatus('valid');
        setManagerInfo({ id: data.id, name: data.name });
        console.log("✅ Valid team code - Manager:", data.name);
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 CHECK TEAM CODE AVAILABILITY (For Managers)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const checkTeamCodeAvailability = async (code: string) => {
    if (!code || code.length < 3) {
      setTeamCodeStatus('idle');
      return;
    }

    setTeamCodeStatus('checking');
    
    try {
      const normalizedCode = code.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('team_code', normalizedCode)
        .maybeSingle();

      if (error) {
        setTeamCodeStatus('invalid');
        return;
      }

      if (data) {
        // Code already taken
        setTeamCodeStatus('invalid');
      } else {
        // Code available
        setTeamCodeStatus('valid');
      }
    } catch (err) {
      setTeamCodeStatus('invalid');
    }
  };

  // Debounced team code check
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (teamCode.length >= 3) {
      debounceRef.current = setTimeout(() => {
        if (selectedRole === 'member') {
          verifyTeamCode(teamCode);
        } else if (selectedRole === 'manager') {
          checkTeamCodeAvailability(teamCode);
        }
      }, 500);
    } else {
      setTeamCodeStatus('idle');
      setManagerInfo(null);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [teamCode, selectedRole]);

  // Reset team code when role changes
  useEffect(() => {
    setTeamCode('');
    setTeamCodeStatus('idle');
    setManagerInfo(null);
  }, [selectedRole]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔑 FORGOT PASSWORD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccessMessage("Password reset link sent! Check your email inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 HANDLE SUBMIT (LOGIN / SIGNUP) - FIXED!
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔓 LOGIN
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        await signIn({ email, password });
        // Redirect will be handled by auth state change
        
      } else if (mode === "signup") {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📝 SIGNUP
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        // Validation
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        // Role-specific validation
        if (selectedRole === 'member') {
          if (!teamCode) {
            throw new Error("Please enter your team code");
          }
          if (teamCodeStatus !== 'valid' || !managerInfo) {
            throw new Error("Please enter a valid team code");
          }
        }

        if (selectedRole === 'manager') {
          if (!teamCode) {
            throw new Error("Please create a team code for your team");
          }
          if (teamCode.length < 3) {
            throw new Error("Team code must be at least 3 characters");
          }
          if (teamCodeStatus === 'invalid') {
            throw new Error("This team code is already taken");
          }
        }

        console.log("═".repeat(50));
        console.log("📝 SIGNUP SUBMISSION");
        console.log("═".repeat(50));
        console.log("📧 Email:", email);
        console.log("👤 Name:", name);
        console.log("🎭 Role:", selectedRole);
        console.log("🏷️ Team Code:", teamCode);
        console.log("👨‍💼 Manager Info:", managerInfo);
        console.log("═".repeat(50));

        // ✅ KEY FIX: Pass correct parameters based on role
        if (selectedRole === 'member') {
          // Member signup - pass managerId from verified team code
          await signUp({
            email: email.trim(),
            password,
            name: name.trim(),
            role: 'member',
            teamCode: teamCode.trim().toUpperCase(),
            managerId: managerInfo!.id  // ← This is the fix!
          });
        } else if (selectedRole === 'manager') {
          // Manager signup - pass their new team code
          await signUp({
            email: email.trim(),
            password,
            name: name.trim(),
            role: 'manager',
            teamCode: teamCode.trim().toUpperCase()
            // No managerId for managers
          });
        }

        setSuccessMessage("Account created successfully! Redirecting...");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 ROLE CARDS DATA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const roleCards = [
    {
      role: 'member' as UserRole,
      title: 'Team Member',
      description: 'Join an existing team and receive leads',
      icon: Users,
      color: 'blue',
      features: ['Receive leads from your manager', 'Track your performance', 'Automatic Google Sheet']
    },
    {
      role: 'manager' as UserRole,
      title: 'Team Manager',
      description: 'Create a team and distribute leads',
      icon: Briefcase,
      color: 'purple',
      features: ['Create and manage your team', 'Distribute leads to members', 'Team analytics dashboard']
    }
  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 RENDER UI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">LeadFlow</h1>
          <p className="text-slate-400 text-sm mt-1">Lead Distribution System</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white text-center">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot_password' && 'Reset Password'}
            </h2>
            <p className="text-slate-400 text-sm text-center mt-1">
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'signup' && 'Join LeadFlow today'}
              {mode === 'forgot_password' && 'We\'ll send you a reset link'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'forgot_password' ? handleForgotPassword : handleSubmit} className="p-6 space-y-4">
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-200 text-sm">{successMessage}</p>
              </div>
            )}

            {/* ━━━━━━━━━ FORGOT PASSWORD MODE ━━━━━━━━━ */}
            {mode === 'forgot_password' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" />
                      Send Reset Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-2 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </>
            )}

            {/* ━━━━━━━━━ LOGIN / SIGNUP MODE ━━━━━━━━━ */}
            {mode !== 'forgot_password' && (
              <>
                {/* Role Selection (Signup only) */}
                {mode === 'signup' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      I want to join as
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {roleCards.map((card) => (
                        <button
                          key={card.role}
                          type="button"
                          onClick={() => setSelectedRole(card.role)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedRole === card.role
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-white/20 bg-white/5 hover:border-white/40'
                          }`}
                        >
                          <card.icon className={`w-6 h-6 mb-2 ${
                            selectedRole === card.role ? 'text-blue-400' : 'text-slate-400'
                          }`} />
                          <p className={`font-medium text-sm ${
                            selectedRole === card.role ? 'text-white' : 'text-slate-300'
                          }`}>
                            {card.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {card.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name (Signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Team Code (Signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      {selectedRole === 'member' ? 'Team Code (from your manager)' : 'Create Team Code'}
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-12 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        placeholder={selectedRole === 'member' ? 'e.g., WIN11' : 'e.g., MYTEAM'}
                        maxLength={10}
                      />
                      {/* Status Icon */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {teamCodeStatus === 'checking' && (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        )}
                        {teamCodeStatus === 'valid' && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        {teamCodeStatus === 'invalid' && (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Team Code Status Message */}
                    {selectedRole === 'member' && teamCodeStatus === 'valid' && managerInfo && (
                      <p className="mt-1.5 text-sm text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Joining team of: {managerInfo.name}
                      </p>
                    )}
                    {selectedRole === 'member' && teamCodeStatus === 'invalid' && (
                      <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        Invalid team code
                      </p>
                    )}
                    {selectedRole === 'manager' && teamCodeStatus === 'valid' && (
                      <p className="mt-1.5 text-sm text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        This code is available!
                      </p>
                    )}
                    {selectedRole === 'manager' && teamCodeStatus === 'invalid' && (
                      <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        This code is already taken
                      </p>
                    )}
                    {selectedRole === 'manager' && teamCodeStatus === 'idle' && teamCode.length > 0 && teamCode.length < 3 && (
                      <p className="mt-1.5 text-sm text-yellow-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Code must be at least 3 characters
                      </p>
                    )}
                  </div>
                )}

                {/* Forgot Password Link (Login only) */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || (mode === 'signup' && selectedRole === 'member' && teamCodeStatus !== 'valid')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>

                {/* Mode Toggle */}
                <p className="text-center text-slate-400 text-sm">
                  {mode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
