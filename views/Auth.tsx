import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { logEvent } from "../supabaseClient";

// 👇 FIX: Yahan maine naam 'AuthView' se badal kar 'Auth' kar diya hai
export const Auth: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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
        
        // 1. Supabase Signup
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name } }
        });

        if (authError) {
             if (authError.message.toLowerCase().includes("already registered")) {
                 throw new Error("This email is already registered. Please log in.");
             }
             throw authError;
        }

        const user = signUpData.user;
        if (!user) throw new Error("Signup failed. Please try again.");

        // 2. Auto Confirm (Optional)
        setStatusMessage("Verifying account...");
        try {
            await fetch("/api/confirm-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, id: user.id }),
            });
        } catch (e) {
            console.warn("Auto-confirm skipped or failed.");
        }

        // 3. Create Google Sheet (FAIL-SAFE MODE)
        setStatusMessage("Setting up dashboard...");
        let sheetUrl = null;
        try {
            const createSheetResp = await fetch("/api/create-sheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, name: name || "User" }),
            });
            const sheetData = await createSheetResp.json();
            if (sheetData && sheetData.sheetUrl) {
                sheetUrl = sheetData.sheetUrl;
            }
        } catch (sheetErr) {
            console.warn("Sheet creation delayed, will retry later:", sheetErr);
        }

        // 4. Initialize User Profile
        setStatusMessage("Finalizing profile...");
        const initResp = await fetch("/api/init-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: user.email,
                name: name || user.user_metadata?.name,
                sheetUrl: sheetUrl, 
                id: user.id
            }),
        });

        if (!initResp.ok) throw new Error("Failed to save user profile. Please contact support.");

        await logEvent('user_signup_complete', { email });
        
        // Dashboard mein bhejo
        setStatusMessage("Opening dashboard...");
        await refreshProfile();
        
      } else {
        // Login Flow
        setStatusMessage("Logging in...");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        await logEvent('user_login', { userId: data.user?.id });
        await refreshProfile();
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An unexpected error occurred");
      
      if (mode === "signup") {
         await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/80 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        {mode === "login" ? "Login to your account" : "Create your account"}
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        {mode === "login" ? "Welcome back!" : "Join to start receiving leads."}
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required={mode === "signup"}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        
        {statusMessage && (
            <div className="text-sm text-brand-600 bg-brand-50 border border-brand-100 rounded-md px-3 py-2 flex items-center">
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {statusMessage}
            </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center rounded-lg bg-brand-600 text-white text-sm font-medium px-3 py-2 hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {loading
            ? "Processing..."
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              className="text-brand-600 hover:underline font-medium"
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              className="text-brand-600 hover:underline font-medium"
              onClick={() => setMode("login")}
            >
              Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};
