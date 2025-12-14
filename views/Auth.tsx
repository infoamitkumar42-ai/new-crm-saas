import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { logEvent } from "../supabaseClient";
// 👇 Import UserRole type for safety
import { UserRole } from "../types"; 

export const Auth: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // 👇 New State for Role Selection (Default: member)
  const [selectedRole, setSelectedRole] = useState<UserRole>("member");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStatusMessage("");

    try {
      if (mode === "signup") {
        setStatusMessage("Creating account...");
        
        // 1. Create Auth User
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name } }
        });

        if (authError) throw authError;
        const user = signUpData.user;
        if (!user) throw new Error("Signup failed.");

        // 2. Init User in Database with SELECTED ROLE
        // Hum API call mein 'role' bhej rahe hain
        await fetch("/api/init-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: user.email,
                name: name || user.user_metadata?.name,
                id: user.id,
                role: selectedRole // 👈 Using selected role
            }),
        });

        // 3. Fallback: Agar API fail hui to Direct DB Update (Dev Only)
        // Ye production mein mat rakhna, but abhi testing ke liye sahi hai
        const { error: dbError } = await supabase
          .from('users')
          .update({ role: selectedRole })
          .eq('id', user.id);
          
        if(dbError) console.error("Role update failed:", dbError);

        await logEvent('user_signup_complete', { email, role: selectedRole });
        
        setStatusMessage("Opening dashboard...");
        await refreshProfile();
        
      } else {
        // Login Logic (Same as before)
        setStatusMessage("Logging in...");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshProfile();
      }
    } catch (err: any) {
      setError(err.message);
      if (mode === "signup") await supabase.auth.signOut();
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">{mode === "login" ? "Welcome Back" : "Get Started"}</h2>
        <p className="text-slate-500 mt-2">Access your CRM dashboard</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        
        {/* Name Field (Signup Only) */}
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Rahul Kumar" 
              required 
            />
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input 
            className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="name@company.com" 
            required 
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input 
            className="w-full border border-slate-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••" 
            required 
          />
        </div>

        {/* 👇 Role Selection Dropdown (Signup Only - DEV MODE) */}
        {mode === "signup" && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <label className="block text-sm font-bold text-yellow-800 mb-2">
              🧪 Select Role (Dev Mode Only)
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full border border-yellow-300 bg-white px-4 py-2 rounded-lg text-slate-700 focus:ring-2 focus:ring-yellow-500 outline-none"
            >
              <option value="member">👤 Member (Default)</option>
              <option value="manager">👔 Manager</option>
              <option value="admin">👑 Admin</option>
            </select>
            <p className="text-xs text-yellow-700 mt-2">
              Warning: This option is for testing purposes. In production, roles are assigned by Admins.
            </p>
          </div>
        )}

        {/* Error/Status Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {statusMessage && (
          <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
            <span>🔄</span> {statusMessage}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      {/* Switch Mode */}
      <div className="mt-6 text-center text-sm">
        <span className="text-slate-500">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        </span>
        <button 
          className="ml-2 font-bold text-blue-600 hover:text-blue-700 hover:underline" 
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setStatusMessage("");
          }}
        >
          {mode === "login" ? "Sign Up Now" : "Log In"}
        </button>
      </div>
    </div>
  );
};
