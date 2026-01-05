// src/auth/useAuth.tsx

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useRef,
  ReactNode 
} from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { User } from "../types";

// 🔗 Google Apps Script Web App URL
const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzLDTaYagAacas6-Jy5nLSpLv8hVzCrlIC-dZ7l-zWso8suYeFzajrQLnyBA_X9gVs4/exec";

interface SignUpParams {
  email: string;
  password: string;
  name: string;
  role?: 'member' | 'manager' | 'admin';
  teamCode?: string;
  managerId?: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (params: SignUpParams) => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const initCompletedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const processingRef = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE FROM DATABASE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log("📥 Fetching profile for:", userId);
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Profile fetch error:", error);
        return null;
      }

      if (data) {
        console.log("✅ Profile loaded:", data.email);
        console.log("   └─ Manager ID:", data.manager_id || "(none)");
        console.log("   └─ Team Code:", data.team_code || "(none)");
        console.log("   └─ Role:", data.role);
        
        return {
          id: data.id,
          email: data.email,
          name: data.name || "User",
          role: data.role || "member",
          team_code: data.team_code,
          manager_id: data.manager_id,
          sheet_url: data.sheet_url || "",
          sheet_id: data.sheet_id,
          payment_status: data.payment_status || "inactive",
          plan_name: data.plan_name,
          plan_weight: data.plan_weight || 1,
          daily_limit: data.daily_limit || 0,
          leads_today: data.leads_today || 0,
          total_leads_received: data.total_leads_received || 0,
          valid_until: data.valid_until,
          filters: data.filters || {},
          is_active: data.is_active ?? true,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } as User;
      }

      return null;
    } catch (err) {
      console.error("❌ Profile fetch exception:", err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ CREATE TEMP PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createTempProfile = useCallback((user: SupabaseUser): User => ({
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || "User",
    role: "member",
    sheet_url: "",
    payment_status: "inactive",
    valid_until: null,
    filters: {},
    daily_limit: 0,
    leads_today: 0,
    total_leads_received: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  }), []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 LOAD USER PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUserProfile = useCallback(async (user: SupabaseUser): Promise<boolean> => {
    if (currentUserIdRef.current === user.id && processingRef.current) {
      return false;
    }

    processingRef.current = true;
    currentUserIdRef.current = user.id;

    try {
      let fullProfile = await fetchProfile(user.id);
      
      if (!mountedRef.current) {
        processingRef.current = false;
        return false;
      }

      if (!fullProfile) {
        const userData = {
          id: user.id,
          email: user.email?.toLowerCase(),
          name: user.user_metadata?.name || "User",
          role: "member",
          payment_status: "inactive",
          plan_name: "none",
          daily_limit: 0,
          leads_today: 0,
          filters: { pan_india: true },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await supabase.from("users").upsert(userData);
        
        if (mountedRef.current) {
          fullProfile = await fetchProfile(user.id);
        }
      }

      if (mountedRef.current) {
        setProfile(fullProfile || createTempProfile(user));
        processingRef.current = false;
        return true;
      }
      
      processingRef.current = false;
      return false;
    } catch (err) {
      console.error("❌ loadUserProfile error:", err);
      if (mountedRef.current) {
        setProfile(createTempProfile(user));
      }
      processingRef.current = false;
      return true;
    }
  }, [fetchProfile, createTempProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 REFRESH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const fullProfile = await fetchProfile(session.user.id);
      if (fullProfile && mountedRef.current) {
        setProfile(fullProfile);
      }
    }
  }, [session, fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 CREATE GOOGLE SHEET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createUserSheet = useCallback(async (
    userId: string, 
    email: string, 
    name: string
  ): Promise<string | null> => {
    try {
      console.log("📊 Creating sheet for:", email);
      
      const response = await fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'createSheet', userId, email, name })
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const result = JSON.parse(text);
          if (result.success && result.sheetUrl) {
            console.log("✅ Sheet created:", result.sheetUrl);
            return result.sheetUrl;
          }
        } catch {}
      }

      // Fallback to GET
      const getUrl = `${SHEET_CREATOR_URL}?action=createSheet&userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
      const getResponse = await fetch(getUrl);
      
      if (getResponse.ok) {
        const text = await getResponse.text();
        try {
          const result = JSON.parse(text);
          if (result.success && result.sheetUrl) {
            return result.sheetUrl;
          }
        } catch {}
      }

      return null;
    } catch (err) {
      console.warn("Sheet creation failed:", err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    mountedRef.current = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let safetyTimer: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      if (initCompletedRef.current) return;

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          setSession(null);
          setProfile(null);
          setLoading(false);
          initCompletedRef.current = true;
          return;
        }

        if (currentSession?.user) {
          setSession(currentSession);
          await loadUserProfile(currentSession.user);
          if (mountedRef.current) {
            setLoading(false);
            initCompletedRef.current = true;
          }
        } else {
          setSession(null);
          setProfile(null);
          setLoading(false);
          initCompletedRef.current = true;
        }
      } catch (err) {
        if (mountedRef.current) {
          setSession(null);
          setProfile(null);
          setLoading(false);
          initCompletedRef.current = true;
        }
      }
    };

    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return;

        if (!initCompletedRef.current && event === 'INITIAL_SESSION') return;

        switch (event) {
          case 'SIGNED_IN':
            if (newSession?.user) {
              const isDifferentUser = currentUserIdRef.current !== newSession.user.id;
              if (isDifferentUser || !initCompletedRef.current) {
                setSession(newSession);
                setLoading(true);
                await loadUserProfile(newSession.user);
                if (mountedRef.current) setLoading(false);
              } else {
                setSession(newSession);
              }
            }
            break;

          case 'SIGNED_OUT':
            currentUserIdRef.current = null;
            processingRef.current = false;
            setSession(null);
            setProfile(null);
            setLoading(false);
            localStorage.removeItem('leadflow-auth-session');
            break;

          case 'TOKEN_REFRESHED':
            if (newSession) setSession(newSession);
            break;

          case 'USER_UPDATED':
            if (newSession?.user) {
              setSession(newSession);
              const updatedProfile = await fetchProfile(newSession.user.id);
              if (updatedProfile && mountedRef.current) setProfile(updatedProfile);
            }
            break;
        }
      }
    );

    authSubscription = data.subscription;

    safetyTimer = setTimeout(() => {
      if (mountedRef.current && loading && !initCompletedRef.current) {
        setLoading(false);
        initCompletedRef.current = true;
      }
    }, 8000);

    initializeAuth();

    return () => {
      mountedRef.current = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (authSubscription) authSubscription.unsubscribe();
      initCompletedRef.current = false;
      processingRef.current = false;
    };
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      if (mountedRef.current) refreshProfile();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, refreshProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 SIGN UP (FIXED WITH DETAILED DEBUGGING)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signUp = useCallback(async ({ 
    email, 
    password, 
    name, 
    role = 'member',
    teamCode,
    managerId 
  }: SignUpParams) => {
    console.log("═".repeat(50));
    console.log("📝 SIGNUP STARTED");
    console.log("═".repeat(50));
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    console.log("🎭 Role:", role);
    console.log("🏷️ Team Code:", teamCode || "(none)");
    console.log("👨‍💼 Manager ID (passed):", managerId || "(none)");
    console.log("═".repeat(50));
    
    setLoading(true);
    
    try {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 1: Resolve Manager ID for Members
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let resolvedManagerId: string | null = managerId || null;
      let resolvedTeamCode: string | null = teamCode?.trim().toUpperCase() || null;

      if (role === 'member') {
        if (!resolvedTeamCode) {
          throw new Error("Team code is required for members");
        }

        // If managerId wasn't passed, resolve it from team code
        if (!resolvedManagerId) {
          console.log("🔍 Looking up manager for team code:", resolvedTeamCode);
          
          const { data: managerData, error: managerError } = await supabase
            .from('users')
            .select('id, name, email, role, team_code')
            .eq('team_code', resolvedTeamCode)
            .eq('role', 'manager')
            .maybeSingle();

          console.log("🔍 Manager lookup result:", { data: managerData, error: managerError });

          if (managerError) {
            console.error("❌ Manager lookup error:", managerError);
            throw new Error("Failed to verify team code. Please try again.");
          }

          if (!managerData) {
            console.error("❌ No manager found for team code:", resolvedTeamCode);
            throw new Error(`Invalid team code "${resolvedTeamCode}". Please check with your manager.`);
          }

          resolvedManagerId = managerData.id;
          console.log("✅ Found Manager:", managerData.name, "| ID:", managerData.id);
        }
      }

      // For Managers - check if team code is unique
      if (role === 'manager' && resolvedTeamCode) {
        const { data: existingCode } = await supabase
          .from('users')
          .select('id')
          .eq('team_code', resolvedTeamCode)
          .maybeSingle();

        if (existingCode) {
          throw new Error(`Team code "${resolvedTeamCode}" is already taken.`);
        }
        
        // Managers don't have a manager
        resolvedManagerId = null;
      }

      console.log("─".repeat(50));
      console.log("📊 RESOLVED VALUES:");
      console.log("   Team Code:", resolvedTeamCode);
      console.log("   Manager ID:", resolvedManagerId);
      console.log("─".repeat(50));

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 2: Create Auth User
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log("🔐 Creating auth user...");
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { 
          data: { 
            name: name.trim(),
            role: role 
          } 
        }
      });

      if (authError) {
        console.error("❌ Auth error:", authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error("Signup failed - no user created");
      }

      const userId = authData.user.id;
      console.log("✅ Auth user created:", userId);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 3: Create Google Sheet (Members only)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let sheetUrl: string | null = null;
      
      if (role === 'member') {
        sheetUrl = await createUserSheet(userId, email, name);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 4: Insert into Database
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const userData = {
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: role,
        team_code: resolvedTeamCode,
        manager_id: resolvedManagerId, // ← THIS IS THE KEY FIELD
        sheet_url: sheetUrl,
        payment_status: 'inactive',
        plan_name: 'none',
        plan_weight: 1,
        daily_limit: 0,
        leads_today: 0,
        total_leads_received: 0,
        filters: { pan_india: true },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("═".repeat(50));
      console.log("💾 INSERTING INTO DATABASE:");
      console.log(JSON.stringify(userData, null, 2));
      console.log("═".repeat(50));

      const { data: insertData, error: dbError } = await supabase
        .from('users')
        .upsert(userData)
        .select()
        .single();

      if (dbError) {
        console.error("❌ DATABASE INSERT ERROR:", dbError);
        console.error("   Code:", dbError.code);
        console.error("   Message:", dbError.message);
        console.error("   Details:", dbError.details);
        console.error("   Hint:", dbError.hint);
        
        // Try alternative insert method
        console.log("🔄 Trying alternative insert...");
        
        const { error: insertError } = await supabase
          .from('users')
          .insert(userData);
        
        if (insertError) {
          console.error("❌ Alternative insert also failed:", insertError);
        } else {
          console.log("✅ Alternative insert succeeded!");
        }
      } else {
        console.log("✅ Database insert successful!");
        console.log("📋 Inserted data:", insertData);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 5: VERIFY THE SAVE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log("🔍 Verifying saved data...");
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('id, email, name, role, team_code, manager_id')
        .eq('id', userId)
        .single();

      if (verifyError) {
        console.error("❌ Verification error:", verifyError);
      } else {
        console.log("═".repeat(50));
        console.log("✅ VERIFICATION - Data in Database:");
        console.log("   ID:", verifyData.id);
        console.log("   Email:", verifyData.email);
        console.log("   Name:", verifyData.name);
        console.log("   Role:", verifyData.role);
        console.log("   Team Code:", verifyData.team_code || "(null)");
        console.log("   Manager ID:", verifyData.manager_id || "(null) ⚠️");
        console.log("═".repeat(50));

        // Check if manager_id was saved
        if (role === 'member' && resolvedManagerId && !verifyData.manager_id) {
          console.error("❌ CRITICAL: manager_id was NOT saved!");
          console.log("🔧 Attempting direct UPDATE...");
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              manager_id: resolvedManagerId,
              team_code: resolvedTeamCode
            })
            .eq('id', userId);
          
          if (updateError) {
            console.error("❌ Direct update failed:", updateError);
          } else {
            console.log("✅ Direct update successful!");
            
            // Verify again
            const { data: finalCheck } = await supabase
              .from('users')
              .select('manager_id, team_code')
              .eq('id', userId)
              .single();
            
            console.log("📋 Final verification:", finalCheck);
          }
        }
      }

      console.log("═".repeat(50));
      console.log("✅ SIGNUP COMPLETE!");
      console.log("═".repeat(50));
      
    } catch (err) {
      console.error("❌ Signup error:", err);
      setLoading(false);
      throw err;
    }
  }, [createUserSheet]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 SIGN IN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    console.log("🔓 Signing in:", email);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        setLoading(false);
        throw error;
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👋 SIGN OUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signOut = useCallback(async () => {
    currentUserIdRef.current = null;
    processingRef.current = false;
    setSession(null);
    setProfile(null);
    localStorage.removeItem('leadflow-auth-session');
    
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    
    setLoading(false);
  }, []);

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default useAuth;
