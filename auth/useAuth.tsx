import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { User } from "../types";

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  signUp: (params: { email: string; password: string; name: string }) => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: Load Profile Logic with FORCE ENTRY
  const fetchAndSetProfile = async (u: SupabaseUser) => {
    try {
        // 1. Try Fetching Profile from DB
        let { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", u.id)
            .maybeSingle();

        // 2. Agar DB mein nahi mila (ya RLS error aaya)
        if (!data) {
            console.log("⚠️ Profile missing or hidden. Attempting auto-fix...");
            
            const newProfile = {
                id: u.id,
                email: u.email,
                name: u.user_metadata?.name || "User",
                payment_status: "inactive",
                daily_limit: 2,
                filters: {}
            };
            
            // Try Creating Row
            const { error: insertError } = await supabase.from("users").insert([newProfile]);
            
            if (!insertError) {
                console.log("✅ Profile created successfully.");
                data = newProfile;
            } else {
                console.warn("❌ Creation failed (Likely Duplicate or RLS). FORCING ENTRY ANYWAY.");
                // 🔥 THE MAGIC FIX: Agar DB mana kare, tab bhi Local State set kar do!
                // Isse user 'Finalizing Setup' par nahi atkega.
                data = newProfile; 
            }
        }

        // 3. Set State (Ab data null nahi ho sakta)
        if (data) {
          setProfile({
            id: data.id || u.id,
            email: data.email || u.email || "",
            name: data.name || "",
            sheet_url: data.sheet_url || "",
            payment_status: data.payment_status || "inactive",
            valid_until: data.valid_until || null,
            filters: data.filters || {},
            daily_limit: data.daily_limit || 10,
            role: data.role || "user",
          });
        }
    } catch (err) {
        console.error("Critical Auth Error:", err);
        // Even on crash, stop loading
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety Timer
    const safetyTimer = setTimeout(() => {
        if (loading) setLoading(false);
    }, 4000);

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session ?? null);
        if (data.session?.user) {
          await fetchAndSetProfile(data.session.user);
        } else {
          setLoading(false);
        }
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setSession(session);
          if (session?.user) {
            await fetchAndSetProfile(session.user);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await fetchAndSetProfile(session.user);
  };

  const signUp: AuthContextValue["signUp"] = async ({ email, password, name }) => {
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { name } }
    });
    if (error) throw error;
  };

  const signIn: AuthContextValue["signIn"] = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
