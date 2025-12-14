import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { supabase } from "../supabaseClient";
import { logEvent } from "../supabaseClient";
import { UserRole } from "../types"; 
import { Users, Briefcase, ShieldCheck } from "lucide-react"; // Icons for pro look

export const Auth: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // 👇 New Logic: Team Code
  const [teamCode, setTeamCode] = useState(""); 
  
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
        
        // Validation
        if (selectedRole === 'member' && !teamCode) throw new Error("Please enter a Team Code to join.");
        if (selectedRole === 'manager' && !teamCode) throw new Error("Please create a unique Team Code for your team.");

        setStatusMessage("Verifying details...");

        let managerId = null;

        // 🔍 MEMBER LOGIC: Verify Team Code exists
        if (selectedRole === 'member') {
            const { data: managerData, error: managerError } = await supabase
                .from('users')
                .select('id, role')
                .eq('team_code', teamCode) // Check Team Code
                .single();

            if (managerError || !managerData) throw new Error("Invalid Team Code. Please ask your manager for the correct code.");
            if (managerData.role !== 'manager') throw new Error("This code does not belong to a Manager.");
            
            managerId = managerData.id; // Found the Manager!
        }

        // 🔍 MANAGER LOGIC: Verify Team Code is unique
        if (selectedRole === 'manager') {
            const { data: existingCode } = await supabase
                .from('users')
                .select('id')
                .eq('team_code', teamCode)
                .single();
            
            if (existingCode) throw new Error("This Team Code is already taken. Please choose another.");
        }

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

        // 2. Prepare Data for DB
        const userData: any = {
            email: user.email,
            name: name || user.user_metadata?.name,
            id: user.id,
            role: selectedRole,
            team_code: selectedRole === 'manager' ? teamCode : null, // Only managers have their own code
            manager_id: managerId // Members get linked here
        };

        // 3. Save to Database (Using upsert for safety)
        const { error: dbError } = await supabase
            .from('users')
            .upsert(userData);

        if (dbError) {
             console.error("DB Error:", dbError);
             // Fallback: Try API if direct DB fails (Optional)
             await fetch("/api/init-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });
        }

        await logEvent('user_signup_complete', { email, role: selectedRole });
        setStatusMessage("Success! Opening dashboard...");
        await refreshProfile();
        
      } else {
        // Login Logic
        setStatusMessage("Logging in...");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshProfile();
      }
    } catch (err: any) {
      setError(err.message);
      if (mode === "signup" && err.message.includes("Signup failed")) await supabase.auth.signOut();
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

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
              <input className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Kumar" required />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
            <input className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {/* 👇 Professional Role & Team Code Section */}
          {mode === "signup" && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Your Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("member")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${selectedRole === 'member' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                  >
                    <Users size={20} className="mb-1" />
                    <span className="text-xs font-bold">Team Member</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("manager")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${selectedRole === 'manager' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                  >
                    <Briefcase size={20} className="mb-1" />
                    <span className="text-xs font-bold">Manager</span>
                  </button>
                </div>
              </div>

              {/* 👇 Dynamic Input based on Role */}
              <div className="animate-fade-in-up">
                {selectedRole === 'member' ? (
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Enter Team Code <span className="text-red-500">*</span></label>
                     <div className="relative">
                       <ShieldCheck className="absolute left-3 top-3 text-slate-400" size={18} />
                       <input 
                         className="w-full border px-4 py-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase placeholder:normal-case"
                         value={teamCode} 
                         onChange={e => setTeamCode(e.target.value.toUpperCase())} 
                         placeholder="e.g. HIMANSHU100" 
                         required 
                       />
                     </div>
                     <p className="text-xs text-slate-500 mt-1">Ask your manager for their Team Code.</p>
                   </div>
                ) : (
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Create Your Team Code <span className="text-red-500">*</span></label>
                     <div className="relative">
                       <Users className="absolute left-3 top-3 text-slate-400" size={18} />
                       <input 
                         className="w-full border px-4 py-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase placeholder:normal-case"
                         value={teamCode} 
                         onChange={e => setTeamCode(e.target.value.toUpperCase().replace(/\s/g, ''))} 
                         placeholder="e.g. WINNERS_CLUB" 
                         required 
                       />
                     </div>
                     <p className="text-xs text-slate-500 mt-1">This is the code your team will use to join.</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">⚠️ {error}</div>}
          {statusMessage && <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">🔄 {statusMessage}</div>}

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full font-bold py-3.5 rounded-xl text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                mode === 'signup' && selectedRole === 'manager' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? "Processing..." : mode === "login" ? "Log In" : selectedRole === 'manager' ? "Create Manager Account" : "Join Team"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            {mode === "login" ? "New to LeadFlow?" : "Already have an account?"}
            <button 
              className="ml-2 font-bold text-blue-600 hover:underline" 
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            >
              {mode === "login" ? "Create Account" : "Login Here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
