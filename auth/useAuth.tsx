/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - useAuth.tsx v5.0 (DB TRIGGER EDITION)         ║
 * ║  Status: UNBEATABLE                                        ║
 * ║  Logic: Rely on DB Trigger for User Creation               ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { User } from "../types";

const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzLDTaYagAacas6-Jy5nLSpLv8hVzCrlIC-dZ7l-zWso8suYeFzajrQLnyBA_X9gVs4/exec";

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (params: any) => Promise<void>;
  signIn: (params: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) return null;
      return data as User;
    } catch {
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 CREATE SHEET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createSheet = useCallback(async (userId: string, email: string, name: string) => {
    try {
      // Background request (no await)
      fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createSheet', userId, email, name })
      }).catch(console.error);
    } catch (e) {
      console.error("Sheet trigger failed", e);
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSession(session);
        const userProfile = await fetchProfile(session.user.id);
        if (mountedRef.current) setProfile(userProfile);
      }
      if (mountedRef.current) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;
      
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        // Wait 1s for DB Trigger to finish insertion
        setTimeout(async () => {
          const userProfile = await fetchProfile(newSession.user.id);
          if (mountedRef.current) {
            setProfile(userProfile);
            setLoading(false);
          }
        }, 1500); 
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    });

    init();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 SIGN UP (CLEAN LOGIC)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signUp = useCallback(async ({ email, password, name, role = 'member', teamCode, managerId }: any) => {
    setLoading(true);
    try {
      let finalManagerId = managerId;
      let finalTeamCode = teamCode?.trim().toUpperCase();

      // Resolve Manager ID
      if (role === 'member' && finalTeamCode && !finalManagerId) {
        const { data } = await supabase.from('users').select('id').eq('team_code', finalTeamCode).eq('role', 'manager').single();
        if (!data) throw new Error("Invalid team code");
        finalManagerId = data.id;
      }

      // Check Team Code Availability
      if (role === 'manager' && finalTeamCode) {
        const { data } = await supabase.from('users').select('id').eq('team_code', finalTeamCode).single();
        if (data) throw new Error("Team code taken");
      }

      // ✅ PASS DATA TO METADATA (Trigger handles insertion)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            role,
            team_code: finalTeamCode,
            manager_id: finalManagerId // ✅ DB Trigger will read this
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      // Trigger Sheet Creation immediately
      if (role === 'member') {
        createSheet(data.user.id, email, name);
      }

    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [createSheet]);

  const signIn = useCallback(async ({ email, password }: any) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setLoading(false);
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const p = await fetchProfile(session.user.id);
      if (p && mountedRef.current) setProfile(p);
    }
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAuthenticated, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
export default useAuth;
