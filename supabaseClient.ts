import { createClient } from '@supabase/supabase-js';

// NOTE: In a real app, these would come from process.env
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://xyz.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_KEY || 'eyJrh...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to get session (Simulated for this demo if no actual backend is connected)
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

// Logging Utility
export const logEvent = async (userId: string | undefined, action: string, details: object = {}) => {
  // If no user ID is provided (e.g. anonymous visitor), we might skip or log as null
  // For this mock, we just console log if supabase isn't fully configured
  try {
    const { error } = await supabase.from('logs').insert({
      user_id: userId || null,
      action,
      details,
      created_at: new Date().toISOString()
    });
    
    if (error) {
      console.warn('Failed to log event to Supabase:', error.message);
    } else {
      console.log(`[Log] Action: ${action}`, details);
    }
  } catch (e) {
    console.error('Exception logging event:', e);
  }
};
