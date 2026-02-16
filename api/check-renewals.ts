import { createClient } from '@supabase/supabase-js';

/**
 * CHECK RENEWALS v2 - QUOTA-BASED ONLY
 * 
 * IMPORTANT: Date expiry is NOW DISABLED
 * Plan expires ONLY when total leads quota is complete
 * 
 * This endpoint now:
 * 1. Checks users who have EXHAUSTED their lead quota
 * 2. IGNORES date (valid_until) completely
 * 3. Allows early renewals to add more quota
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Plan limits per payment (Reference only)
const PLAN_LIMITS: { [key: string]: number } = {
  'starter': 55,
  'supervisor': 115,
  'manager': 176,
  'weekly_boost': 92,
  'turbo_boost': 108
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Get all users with active plans
    const { data: activeUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, plan_name, payment_status, daily_limit')
      .eq('payment_status', 'active')
      .neq('plan_name', 'none');

    if (fetchError) throw fetchError;

    if (!activeUsers || activeUsers.length === 0) {
      return res.status(200).json({ message: 'No active users found', count: 0 });
    }

    const quotaExhausted: any[] = [];

    // 2. Check each user's quota (NOT DATE)
    for (const user of activeUsers) {
      // Get REAL leads count
      const { count: realLeadsCount } = await supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const totalReceived = realLeadsCount || 0;

      // Fetch current promised quota from DB (Single Source of Truth)
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('total_leads_promised')
        .eq('id', user.id)
        .single();

      const totalPromised = userData?.total_leads_promised || 0;

      // If quota exhausted, deactivate
      // Strict check: Received >= Promised
      if (totalReceived >= totalPromised && totalPromised > 0) {
        await supabaseAdmin
          .from('users')
          .update({
            payment_status: 'inactive',
            daily_limit: 0,
            is_active: false,
            is_online: false,
            // valid_until: '2099...' // No need to change, already infinite
            plan_name: 'none' // Optionally reset plan name to avoid confusion
          })
          .eq('id', user.id);

        quotaExhausted.push({
          name: user.name,
          email: user.email,
          leadsReceived: totalReceived,
          totalQuota: totalPromised
        });

        console.log(`🛑 Quota exhausted: ${user.name} (${totalReceived}/${totalPromised})`);
      }
    }

    return res.status(200).json({
      message: 'Quota check complete (DATE IGNORED)',
      quotaExhaustedCount: quotaExhausted.length,
      users: quotaExhausted
    });

  } catch (error: any) {
    console.error('Quota Check Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
