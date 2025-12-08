
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./config/env";

export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY
);

/**
 * Centralized logging service.
 * Persists events to the 'logs' table in Supabase.
 * 
 * @param event - The action name (e.g., 'filter_updated', 'payment_success').
 * @param payload - JSON object containing details.
 * @param userId - Optional. If not provided on frontend, attempts to resolve from session.
 * @param client - Optional. Pass a specific Supabase client (e.g., admin client for backend).
 */
export async function logEvent(
  event: string, 
  payload: any, 
  userId?: string, 
  client: SupabaseClient = supabase
) {
  // Always log to console for immediate debugging
  console.log(`[LOG service]: ${event}`, payload);

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
        details: payload
      });

      if (error) {
        // Suppress "table not found" errors to avoid console noise if schema isn't set up
        // Check both code 42P01 and message content
        if (error.code === '42P01' || error.message.includes('Could not find the table')) {
            console.warn("Supabase 'logs' table not found. Skipping DB log.");
        } else {
            console.error("Failed to write log to Supabase:", error.message);
        }
      }
    } else {
      console.warn("Skipping DB log: User ID not available for event", event);
    }
  } catch (err) {
    console.error("Exception in logEvent service:", err);
  }
}
