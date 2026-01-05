// src/auth/useAuth.tsx
// v3.3 - NO TIMEOUTS, NO COMPLEX LOGIC

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { User } from "../types";

const AuthContext = createContext<any>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('📥 Fetching profile:', userId);
      // DIRECT CALL - NO TIMEOUT WRAPPER
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Profile Error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('❌ Exception:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    console.log('🚀 Auth Init...');

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && mountedRef.current) {
        console.log('✅ Session found');
        setSession(session);
        const userProfile = await fetchProfile(session.user.id);
        if (mountedRef.current) setProfile(userProfile);
      }
      
      if (mountedRef.current) {
        setLoading(false);
        console.log('🏁 Auth Loading Complete');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔔 Auth Event:', event);
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' && newSession?.user) {
        setSession(newSession);
        const userProfile = await fetchProfile(newSession.user.id);
        if (mountedRef.current) setProfile(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
      }
    });

    init();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default useAuth;
