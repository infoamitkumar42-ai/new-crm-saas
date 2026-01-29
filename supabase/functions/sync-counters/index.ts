import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * COUNTER SYNC FUNCTION
 * 
 * Syncs leads_today counter with actual lead count from database
 * Call this whenever you suspect counters are out of sync
 * 
 * Endpoint: POST /sync-counters
 * Optional body: { "userId": "specific-user-id" } - sync single user
 * Empty body: syncs ALL active users
 */

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const specificUserId = body.userId;

        // Get today's date range
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

        let query = supabase.from('users').select('id, name, leads_today');
        if (specificUserId) {
            query = query.eq('id', specificUserId);
        } else {
            query = query.eq('is_active', true);
        }

        const { data: users, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        const results = [];
        let totalFixed = 0;

        for (const user of users || []) {
            // Get actual count from leads table
            const { count: actualCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', todayStart)
                .lt('created_at', tomorrowStart);

            const storedCount = user.leads_today || 0;
            const actual = actualCount || 0;

            if (storedCount !== actual) {
                // Update the counter
                await supabase
                    .from('users')
                    .update({ leads_today: actual })
                    .eq('id', user.id);

                results.push({
                    name: user.name,
                    before: storedCount,
                    after: actual,
                    fixed: true
                });
                totalFixed++;
            }
        }

        return new Response(JSON.stringify({
            status: 'SUCCESS',
            usersChecked: users?.length || 0,
            discrepanciesFixed: totalFixed,
            details: results
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error('Sync failed:', error);
        return new Response(JSON.stringify({
            error: error.message,
            status: 'FAILED'
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
