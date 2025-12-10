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

  // Helper: Profile Fetch
  const fetchProfile = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (error) return null;
      return data;
    } catch (e) { return null; }
  };

  const loadProfile = async (supabaseUser: SupabaseUser | undefined) => {
    try {
        if (!supabaseUser || !supabaseUser.email) {
          setProfile(null);
          return;
        }
        const dbUser = await fetchProfile(supabaseUser.email);
        
        if (dbUser) {
          setProfile({
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || "",
            sheet_url: dbUser.sheet_url || "",
            payment_status: dbUser.payment_status || "inactive",
            valid_until: dbUser.valid_until || null,
            filters: dbUser.filters || {},
            daily_limit: dbUser.daily_limit || 10,
            role: dbUser.role || "user",
          });
        } else {
          setProfile(null);
        }
    } catch (error) {
        console.error("Load Profile Error", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 🛡️ SAFETY TIMER (3 Seconds)
    // Ye Back button issue ko solve karega
    const safetyTimer = setTimeout(() => {
        if (loading) {
            console.log("Loading taking too long, forcing open...");
            setLoading(false);
        }
    }, 3000);

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session ?? null);
          if (data.session?.user) {
            await loadProfile(data.session.user);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setSession(session);
          if (session?.user) {
            await loadProfile(session.user);
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
    if (session?.user) await loadProfile(session.user);
  };

  const signUp: AuthContextValue["signUp"] = async ({ email, password }) => {
    const { error } = await supabase.auth.signUp({ email, password });
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
