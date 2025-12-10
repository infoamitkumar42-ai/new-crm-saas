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
    // 1. TURANT FAKE PROFILE BANAO (Taaki user atke nahi)
    // Ye temporary profile UI ko khush kar degi
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
    
    // UI Update immediately (No Waiting for DB)
    setProfile(tempProfile); 
    setLoading(false);

    // 2. Ab aaram se Background mein Asli Data dhundo
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", u.id)
            .maybeSingle();

        if (data) {
            // Agar asli data mil gaya, to update kar do
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
            // Agar DB mein row nahi hai, to silently create kar do
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
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session ?? null);
        if (data.session?.user) {
          // 🔥 Call Instant Load
          instantLoad(data.session.user);
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
