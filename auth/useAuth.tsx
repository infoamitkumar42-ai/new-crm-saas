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

  // 🔥 SUPER FAST LOADER (Instant Dashboard)
  const instantLoad = async (u: SupabaseUser) => {
    const tempProfile: User = {
        id: u.id,
        email: u.email || "",
        name: u.user_metadata?.name || "User",
        sheet_url: "",
        payment_status: "inactive",
        valid_until: null,
        filters: {},
        daily_limit: 2,
        role: "user"
    };
    
    setProfile(tempProfile); 
    setLoading(false);

    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", u.id)
            .maybeSingle();

        if (data) {
            setProfile({
                id: data.id,
                email: data.email,
                name: data.name || "User",
                sheet_url: data.sheet_url || "",
                payment_status: data.payment_status || "inactive",
                valid_until: data.valid_until || null,
                filters: data.filters || {},
                daily_limit: data.daily_limit || 2,
                role: data.role || "user",
            });
        } else {
            await supabase.from("users").insert([tempProfile]);
        }
    } catch (err) {
        console.warn("Background sync failed, keeping temp profile.");
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety Timer
    setTimeout(() => { if(loading) setLoading(false); }, 2000);

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        // 🛡️ Token Error Recovery
        if (error) {
          console.warn('Session recovery failed:', error.message);
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(data.session ?? null);
          if (data.session?.user) {
            instantLoad(data.session.user);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        if (mounted) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          // 🛡️ Handle Token Expiry
          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          
          setSession(session);
          if (session?.user) {
            instantLoad(session.user);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await instantLoad(session.user);
  };

  const signUp = async ({ email, password, name }: any) => {
    const { error } = await supabase.auth.signUp({ 
        email, password, options: { data: { name } }
    });
    if (error) throw error;
  };

  const signIn = async ({ email, password }: any) => {
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
