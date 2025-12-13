import { createClient } from '@supabase/supabase-js';

// Environment variables check
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

// Admin Client (Service Role needed for updates)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: any, res: any) {
  // Cron jobs often use GET, but POST is safer. Allowing both for testing.
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date();
    
    // 1. Find expiring users (valid_until <= today)
    const { data: expiringUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('payment_status', 'active')
      .lte('valid_until', today.toISOString());

    if (fetchError) throw fetchError;

    if (!expiringUsers || expiringUsers.length === 0) {
      return res.status(200).json({ message: 'No expiring users found', count: 0 });
    }

    // 2. Deactivate expired users
    const updates = expiringUsers.map(async (user: any) => {
      // Update User Status
      await supabaseAdmin
        .from('users')
        .update({ 
          payment_status: 'inactive', 
          daily_limit: 0,
          leads_today: 0
        })
        .eq('id', user.id);

      // Log the event
      await supabaseAdmin.from('logs').insert({
        user_id: user.id,
        action: 'plan_expired',
        details: { expired_on: today.toISOString(), last_plan: user.daily_limit }
      });
    });

    await Promise.all(updates);

    return res.status(200).json({ 
      message: 'Renewals processed successfully', 
      expired_count: expiringUsers.length,
      users: expiringUsers.map((u: any) => u.email)
    });

  } catch (error: any) {
    console.error('Renewal Check Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
