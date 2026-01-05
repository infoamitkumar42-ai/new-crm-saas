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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔒 REFS TO PREVENT RACE CONDITIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        console.log("✅ Profile loaded:", data.email, "| Manager ID:", data.manager_id);
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

      console.log("⚠️ No profile found for user");
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
      console.log("⏭️ Already loading profile for this user, skipping");
      return false;
    }

    processingRef.current = true;
    currentUserIdRef.current = user.id;

    console.log("🔄 Loading profile for:", user.email);
    
    try {
      let fullProfile = await fetchProfile(user.id);
      
      if (!mountedRef.current) {
        processingRef.current = false;
        return false;
      }

      if (!fullProfile) {
        console.log("⚠️ Creating missing user entry...");
        
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
        
        const { error } = await supabase.from("users").upsert(userData);
        
        if (!mountedRef.current) {
          processingRef.current = false;
          return false;
        }
        
        if (!error) {
          fullProfile = await fetchProfile(user.id);
        }
        
        if (!mountedRef.current) {
          processingRef.current = false;
          return false;
        }
      }

      if (mountedRef.current) {
        const profileToSet = fullProfile || createTempProfile(user);
        setProfile(profileToSet);
        console.log("✅ Profile set successfully:", profileToSet.email);
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
        body: JSON.stringify({
          action: 'createSheet',
          userId,
          email,
          name
        })
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
  // 🔍 RESOLVE MANAGER FROM TEAM CODE (NEW!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const resolveManagerFromTeamCode = useCallback(async (teamCode: string): Promise<{
    managerId: string | null;
    managerName: string | null;
    error: string | null;
  }> => {
    try {
      console.log("🔍 Resolving manager for team code:", teamCode);
      
      const normalizedCode = teamCode.trim().toUpperCase();
      
      // Query the users table for a manager with this team_code
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('team_code', normalizedCode)
        .eq('role', 'manager')
        .maybeSingle();

      if (error) {
        console.error("❌ Team code lookup error:", error);
        return { managerId: null, managerName: null, error: "Failed to verify team code" };
      }

      if (!data) {
        console.log("⚠️ No manager found for team code:", normalizedCode);
        return { managerId: null, managerName: null, error: "Invalid team code" };
      }

      console.log("✅ Manager found:", data.name, "(", data.id, ")");
      return { managerId: data.id, managerName: data.name, error: null };
    } catch (err) {
      console.error("❌ resolveManagerFromTeamCode error:", err);
      return { managerId: null, managerName: null, error: "Failed to verify team code" };
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    mountedRef.current = true;

    console.log("🔐 Auth Init starting...");

    let authSubscription: { unsubscribe: () => void } | null = null;
    let safetyTimer: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      if (initCompletedRef.current) {
        console.log("⏭️ Auth init already completed, skipping");
        return;
      }

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          console.error("❌ Session error:", error.message);
          setSession(null);
          setProfile(null);
          setLoading(false);
          initCompletedRef.current = true;
          return;
        }

        if (currentSession?.user) {
          console.log("✅ Session found:", currentSession.user.email);
          setSession(currentSession);
          await loadUserProfile(currentSession.user);
          
          if (mountedRef.current) {
            setLoading(false);
            initCompletedRef.current = true;
            console.log("✅ Auth init complete (authenticated)");
          }
        } else {
          console.log("ℹ️ No active session");
          setSession(null);
          setProfile(null);
          setLoading(false);
          initCompletedRef.current = true;
          console.log("✅ Auth init complete (not authenticated)");
        }
      } catch (err) {
        console.error("❌ Auth init error:", err);
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

        console.log("🔔 Auth event:", event);

        if (!initCompletedRef.current && event === 'INITIAL_SESSION') {
          console.log("⏭️ Skipping INITIAL_SESSION during init");
          return;
        }

        switch (event) {
          case 'SIGNED_IN':
            if (newSession?.user) {
              const isDifferentUser = currentUserIdRef.current !== newSession.user.id;
              
              if (isDifferentUser || !initCompletedRef.current) {
                console.log("🔄 Processing SIGNED_IN for:", newSession.user.email);
                setSession(newSession);
                setLoading(true);
                await loadUserProfile(newSession.user);
                if (mountedRef.current) {
                  setLoading(false);
                }
              } else {
                setSession(newSession);
              }
            }
            break;

          case 'SIGNED_OUT':
            console.log("👋 User signed out via auth event");
            currentUserIdRef.current = null;
            processingRef.current = false;
            setSession(null);
            setProfile(null);
            setLoading(false);
            localStorage.removeItem('leadflow-auth-session');
            break;

          case 'TOKEN_REFRESHED':
            if (newSession) {
              console.log("🔄 Token refreshed");
              setSession(newSession);
            }
            break;

          case 'USER_UPDATED':
            if (newSession?.user) {
              console.log("👤 User updated");
              setSession(newSession);
              const updatedProfile = await fetchProfile(newSession.user.id);
              if (updatedProfile && mountedRef.current) {
                setProfile(updatedProfile);
              }
            }
            break;

          default:
            break;
        }
      }
    );

    authSubscription = data.subscription;

    safetyTimer = setTimeout(() => {
      if (mountedRef.current && loading && !initCompletedRef.current) {
        console.warn("⚠️ Safety timeout triggered - forcing load complete");
        setLoading(false);
        initCompletedRef.current = true;
      }
    }, 8000);

    initializeAuth();

    return () => {
      console.log("🧹 Auth cleanup");
      mountedRef.current = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (authSubscription) authSubscription.unsubscribe();
      initCompletedRef.current = false;
      processingRef.current = false;
    };
  }, []);

  // Auto refresh every 5 mins
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      if (mountedRef.current) refreshProfile();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, refreshProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 SIGN UP (FIXED VERSION!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signUp = useCallback(async ({ 
    email, 
    password, 
    name, 
    role = 'member',
    teamCode,
    managerId 
  }: SignUpParams) => {
    console.log("📝 ═══════════════════════════════════════");
    console.log("📝 SIGNUP STARTED");
    console.log("📝 Email:", email);
    console.log("📝 Name:", name);
    console.log("📝 Role:", role);
    console.log("📝 Team Code:", teamCode || "(none)");
    console.log("📝 Manager ID (passed):", managerId || "(none)");
    console.log("📝 ═══════════════════════════════════════");
    
    setLoading(true);
    
    try {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 1: Resolve Manager ID if needed
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let resolvedManagerId: string | null = managerId || null;
      let resolvedTeamCode: string | null = null;

      // For MEMBERS: They need a manager_id (from team code)
      if (role === 'member' && teamCode && !resolvedManagerId) {
        console.log("🔍 Member signup - resolving manager from team code...");
        
        const { managerId: foundManagerId, error: resolveError } = await resolveManagerFromTeamCode(teamCode);
        
        if (resolveError || !foundManagerId) {
          setLoading(false);
          throw new Error(resolveError || "Invalid team code. Please check and try again.");
        }
        
        resolvedManagerId = foundManagerId;
        resolvedTeamCode = teamCode.trim().toUpperCase(); // Store team code for members too
        
        console.log("✅ Resolved Manager ID:", resolvedManagerId);
      }

      // For MANAGERS: They create their own team code
      if (role === 'manager' && teamCode) {
        resolvedTeamCode = teamCode.trim().toUpperCase();
        resolvedManagerId = null; // Managers don't have a manager
        
        // Check if team code is already taken
        const { data: existingManager } = await supabase
          .from('users')
          .select('id')
          .eq('team_code', resolvedTeamCode)
          .maybeSingle();
        
        if (existingManager) {
          setLoading(false);
          throw new Error("This team code is already taken. Please choose another.");
        }
        
        console.log("✅ Manager will create team code:", resolvedTeamCode);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 2: Create Auth User
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log("🔐 Creating auth user...");
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { 
          data: { 
            name: name.trim(),
            role: role 
          } 
        }
      });

      if (error) {
        console.error("❌ Auth signup error:", error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error("Signup failed - no user returned");
      }

      console.log("✅ Auth user created:", data.user.id);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 3: Create Google Sheet (for members only)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let sheetUrl: string | null = null;
      
      if (role === 'member') {
        console.log("📊 Creating Google Sheet for member...");
        sheetUrl = await createUserSheet(data.user.id, email, name);
        console.log("📊 Sheet URL:", sheetUrl || "(failed to create)");
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 4: Prepare User Data for Database
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const userData = {
        id: data.user.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: role,
        
        // ✅ KEY FIX: Properly set team_code and manager_id based on role
        team_code: resolvedTeamCode,           // Managers: their code, Members: their manager's code
        manager_id: resolvedManagerId,          // Members: their manager's ID, Managers: null
        
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

      console.log("💾 ═══════════════════════════════════════");
      console.log("💾 SAVING TO DATABASE:");
      console.log("💾 User ID:", userData.id);
      console.log("💾 Email:", userData.email);
      console.log("💾 Role:", userData.role);
      console.log("💾 Team Code:", userData.team_code || "(null)");
      console.log("💾 Manager ID:", userData.manager_id || "(null)");
      console.log("💾 Sheet URL:", userData.sheet_url || "(null)");
      console.log("💾 ═══════════════════════════════════════");

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 5: Insert into Database
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const { error: dbError } = await supabase.from('users').upsert(userData);
      
      if (dbError) {
        console.error("❌ Database insert error:", dbError);
        // Don't throw - user is created in auth, just log the error
        // They can still login and we'll create their profile on first load
      } else {
        console.log("✅ User saved to database successfully!");
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 6: Verify the save (DEBUG)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const { data: verifyData } = await supabase
        .from('users')
        .select('id, email, role, team_code, manager_id')
        .eq('id', data.user.id)
        .single();
      
      console.log("🔍 VERIFICATION - Data in DB:", verifyData);
      
      if (verifyData) {
        if (role === 'member' && !verifyData.manager_id && resolvedManagerId) {
          console.error("❌ WARNING: manager_id was not saved! Attempting direct update...");
          
          // Force update
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              manager_id: resolvedManagerId,
              team_code: resolvedTeamCode 
            })
            .eq('id', data.user.id);
          
          if (updateError) {
            console.error("❌ Force update failed:", updateError);
          } else {
            console.log("✅ Force update successful!");
          }
        }
      }

      console.log("✅ ═══════════════════════════════════════");
      console.log("✅ SIGNUP COMPLETE!");
      console.log("✅ ═══════════════════════════════════════");
      
      // onAuthStateChange will handle the session and profile loading
      
    } catch (err) {
      console.error("❌ Signup error:", err);
      setLoading(false);
      throw err;
    }
  }, [createUserSheet, resolveManagerFromTeamCode]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 SIGN IN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signIn = useCallback(async ({ 
    email, 
    password 
  }: { 
    email: string; 
    password: string 
  }) => {
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
      
      console.log("✅ Sign in initiated");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👋 SIGN OUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signOut = useCallback(async () => {
    console.log("👋 Signing out...");
    
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
    console.log("✅ Signed out");
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎁 CONTEXT VALUE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
