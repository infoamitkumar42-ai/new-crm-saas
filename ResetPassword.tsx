// src/views/ResetPassword.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  KeyRound, Loader2, CheckCircle, AlertTriangle, 
  Eye, EyeOff, Lock, ArrowLeft 
} from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsValidSession(true);
        } else {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const type = hashParams.get('type');
          
          if (type === 'recovery') {
            setIsValidSession(true);
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isValidSession && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-slate-500 mb-6 text-sm">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset Successful!</h2>
          <p className="text-slate-500 mb-6">Redirecting to login...</p>
          <Loader2 size={24} className="animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Set New Password</h2>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                className="w-full border px-4 py-3 pl-10 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                type={showPassword ? 'text' : 'password'}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter new password" 
                required 
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                className="w-full border px-4 py-3 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password" 
                required 
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <ul className="space-y-1 text-xs">
              <li className={password.length >= 6 ? 'text-green-600' : 'text-slate-400'}>
                {password.length >= 6 ? '✓' : '○'} At least 6 characters
              </li>
              <li className={password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-slate-400'}>
                {password === confirmPassword && password.length > 0 ? '✓' : '○'} Passwords match
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || password.length < 6 || password !== confirmPassword} 
            className="w-full font-bold py-3.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Updating...
              </span>
            ) : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            className="flex items-center justify-center gap-2 mx-auto text-slate-500 hover:text-blue-600 text-sm" 
            onClick={() => navigate('/login')}
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
