// src/supabaseClient.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./config/env";

// ✅ Create Supabase client with PERSISTENT SESSION
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      // ✅ Store session in localStorage (persists across browser restarts)
      persistSession: true,
      
      // ✅ Custom storage key
      storageKey: 'leadflow-auth-session',
      
      // ✅ Use localStorage instead of sessionStorage
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      
      // ✅ Auto refresh token before it expires
      autoRefreshToken: true,
      
      // ✅ Detect session from URL (for magic links, password reset)
      detectSessionInUrl: true,
      
      // ✅ Flow type for better security
      flowType: 'pkce',
    },
    
    global: {
      headers: {
        'x-app-name': 'leadflow-crm',
      },
    },
  }
);

/**
 * Centralized logging service.
 * Persists events to the 'logs' table in Supabase.
 */
export async function logEvent(
  event: string, 
  payload: any, 
  userId?: string, 
  client: SupabaseClient = supabase
) {
  // Always log to console for immediate debugging
  console.log(`[LOG]: ${event}`, payload);

  try {
    let targetUserId = userId;

    // If running in browser and no userId provided, try to get from current session
    if (!targetUserId && typeof window !== 'undefined') {
      const { data } = await client.auth.getSession();
      targetUserId = data.session?.user?.id;
    }

    if (targetUserId) {
      const { error } = await client.from('logs').insert({
        user_id: targetUserId,
        action: event,
        details: payload,
        created_at: new Date().toISOString()
      });

      if (error) {
        if (error.code === '42P01' || error.message.includes('Could not find the table')) {
          // Silent fail for missing table
        } else {
          console.error("Failed to write log:", error.message);
        }
      }
    }
  } catch (err) {
    console.error("Exception in logEvent:", err);
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
};
