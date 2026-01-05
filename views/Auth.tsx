// src/views/Auth.tsx - Key parts for the signup form

import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../supabaseClient';
// ... other imports

export const Auth: React.FC = () => {
  const { signUp, signIn } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'member' | 'manager'>('member');
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // For showing manager info after verification
  const [verifiedManager, setVerifiedManager] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 VERIFY TEAM CODE (Optional - for UX)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const verifyTeamCode = async (code: string) => {
    if (!code || code.length < 3) {
      setVerifiedManager(null);
      return;
    }

    try {
      const normalizedCode = code.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_code', normalizedCode)
        .eq('role', 'manager')
        .maybeSingle();

      if (error || !data) {
        setVerifiedManager(null);
        return;
      }

      setVerifiedManager({
        id: data.id,
        name: data.name
      });
      
      console.log("✅ Team code verified - Manager:", data.name);
    } catch (err) {
      setVerifiedManager(null);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 HANDLE SIGNUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!email || !password || !name) {
        throw new Error('Please fill in all required fields');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // For members, team code is required
      if (role === 'member' && !teamCode) {
        throw new Error('Please enter your team code');
      }

      // For managers, team code is required (they create it)
      if (role === 'manager' && !teamCode) {
        throw new Error('Please create a team code for your team');
      }

      console.log("📝 Submitting signup...");
      console.log("📝 Role:", role);
      console.log("📝 Team Code:", teamCode);
      console.log("📝 Verified Manager:", verifiedManager);

      // ✅ KEY: Pass managerId if we have it from verification
      await signUp({
        email,
        password,
        name,
        role,
        teamCode: teamCode.trim().toUpperCase(),
        managerId: verifiedManager?.id || undefined, // Pass if we pre-verified
      });

      // Success - the auth state change will redirect
      console.log("✅ Signup submitted successfully");

    } catch (err: any) {
      console.error("❌ Signup error:", err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 HANDLE LOGIN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          {/* Name (Signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {/* Role Selection (Signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                I am a
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="member"
                    checked={role === 'member'}
                    onChange={() => {
                      setRole('member');
                      setTeamCode('');
                      setVerifiedManager(null);
                    }}
                    className="mr-2"
                  />
                  Team Member
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="manager"
                    checked={role === 'manager'}
                    onChange={() => {
                      setRole('manager');
                      setTeamCode('');
                      setVerifiedManager(null);
                    }}
                    className="mr-2"
                  />
                  Manager
                </label>
              </div>
            </div>
          )}

          {/* Team Code (Signup only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {role === 'member' ? 'Team Code (from your manager)' : 'Create Team Code'}
              </label>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setTeamCode(value);
                  
                  // Auto-verify for members
                  if (role === 'member') {
                    verifyTeamCode(value);
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder={role === 'member' ? 'e.g., WIN11' : 'e.g., MYTEAM'}
                required
                maxLength={10}
              />
              
              {/* Show verified manager for members */}
              {role === 'member' && verifiedManager && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ Joining team of: {verifiedManager.name}
                </p>
              )}
              
              {/* Show hint for managers */}
              {role === 'manager' && teamCode.length >= 3 && (
                <p className="mt-1 text-sm text-slate-500">
                  Your team members will use this code to join
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <p className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setVerifiedManager(null);
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
