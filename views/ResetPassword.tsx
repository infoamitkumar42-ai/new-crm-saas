// src/views/ResetPassword.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Loader2, CheckCircle, XCircle, KeyRound, Eye, EyeOff, AlertTriangle } from "lucide-react";

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const error = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
        
        if (error) {
          setError(errorDescription?.replace(/\+/g, ' ') || "Invalid or expired reset link");
          setIsValidSession(false);
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            setError("Invalid or expired reset link. Please request a new one.");
            setIsValidSession(false);
            return;
          }

          if (data.session) {
            setIsValidSession(true);
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsValidSession(true);
        } else {
          setError("Invalid or expired reset link. Please request a new one.");
          setIsValidSession(false);
        }

      } catch (err) {
        setError("Something went wrong. Please try again.");
        setIsValidSession(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-slate-500 mb-6">
            {error || "This password reset link is invalid or has expired. Please request a new one."}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Updated!</h2>
          <p className="text-slate-500 mb-6">
            Your password has been successfully updated. Redirecting to login...
          </p>
          <Loader2 size={24} className="animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Set New Password
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Enter your new password below
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <XCircle size={18} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border px-4 py-3 pl-10 pr-12 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full border px-4 py-3 pl-10 rounded-lg focus:ring-2 outline-none transition-all ${
                  confirmPassword && password !== confirmPassword 
                    ? 'border-red-500 focus:ring-red-500' 
                    : confirmPassword && password === confirmPassword
                    ? 'border-green-500 focus:ring-green-500'
                    : 'focus:ring-blue-500'
                }`}
                placeholder="••••••••"
                required
              />
              {confirmPassword && password === confirmPassword && (
                <CheckCircle className="absolute right-3 top-3 text-green-500" size={18} />
              )}
              {confirmPassword && password !== confirmPassword && (
                <XCircle className="absolute right-3 top-3 text-red-500" size={18} />
              )}
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            className="w-full font-bold py-3.5 rounded-xl text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Updating Password...
              </span>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
