import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * DAILY COUNTER SYNC & RESET CRON
 * 
 * This function should be triggered daily at midnight IST (6:30 PM UTC previous day)
 * 
 * Tasks:
 * 1. Reset all users' leads_today to 0
 * 2. Log the reset for audit
 * 
 * Deploy: supabase functions deploy daily-counter-reset
 * Schedule: Use Supabase Dashboard > Edge Functions > Cron
 *           Schedule: "30 18 * * *" (6:30 PM UTC = 12:00 AM IST)
 */

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
        const now = new Date().toISOString();
        console.log(`[${now}] Starting daily counter reset...`);

        // 1. Get all active users with their current leads_today for logging
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, name, leads_today')
            .eq('is_active', true)
            .gt('leads_today', 0);

        if (fetchError) throw fetchError;

        // 2. Log before reset
        console.log(`Found ${users?.length || 0} users with leads to reset`);
        const totalLeadsToday = users?.reduce((sum, u) => sum + (u.leads_today || 0), 0) || 0;
        console.log(`Total leads distributed today: ${totalLeadsToday}`);

        // 3. Reset ALL users' leads_today to 0
        const { error: resetError } = await supabase
            .from('users')
            .update({ leads_today: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all users

        if (resetError) throw resetError;

        // 4. Log success
        const summary = {
            timestamp: now,
            usersReset: users?.length || 0,
            totalLeadsYesterday: totalLeadsToday,
            status: 'SUCCESS'
        };

        console.log(`[${now}] Reset complete:`, JSON.stringify(summary));

        return new Response(JSON.stringify(summary), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error('Reset failed:', error);
        return new Response(JSON.stringify({
            error: error.message,
            status: 'FAILED'
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
