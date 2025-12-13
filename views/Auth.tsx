import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { logEvent } from "../supabaseClient";

// 👇 Iska naam hum 'Auth' rakh rahe hain (Sab jagah yahi use hoga)
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
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name } }
        });

        if (authError) throw authError;
        const user = signUpData.user;
        
        // Sheet creation (Fail-safe)
        try {
            await fetch("/api/create-sheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, name: name || "User" }),
            });
        } catch (e) { console.warn("Sheet skipped"); }

        // Init User
        if (user) {
            await fetch("/api/init-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    name: name || user.user_metadata?.name,
                    id: user.id
                }),
            });
        }

        await logEvent('user_signup_complete', { email });
        setStatusMessage("Opening dashboard...");
        await refreshProfile();
        
      } else {
        setStatusMessage("Logging in...");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
    <div className="max-w-md mx-auto bg-white/80 backdrop-blur rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{mode === "login" ? "Login" : "Create Account"}</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" && <input className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required />}
        <input className="w-full border p-2 rounded" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
        <input className="w-full border p-2 rounded" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {statusMessage && <p className="text-blue-500 text-sm">{statusMessage}</p>}
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          {loading ? "Processing..." : mode === "login" ? "Login" : "Sign Up"}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        <button className="text-blue-600 hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Create an account" : "Already have an account?"}
        </button>
      </div>
    </div>
  );
};
