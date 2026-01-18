
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('🌅 Morning Backlog Processor Started')

        // 1. Fetch Backlog Leads
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('id, name, phone, city, state, source, created_at')
            .is('user_id', null)  // Unassigned
            .or('status.eq.Night_Backlog,status.eq.New') // Explicitly backlog or just unpicked
            .order('created_at', { ascending: true }) // Oldest first
            .limit(500) // Batch limit to prevent timeouts

        if (leadsError) throw leadsError

        if (!leads || leads.length === 0) {
            console.log('✅ No backlog leads found to process.')
            return new Response(JSON.stringify({ message: 'No backlog leads', count: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`📦 Found ${leads.length} backlog leads.`)

        // 2. Fetch Active Users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('is_active', true)
            .neq('plan_name', 'none')
            .or('is_plan_pending.is.null,is_plan_pending.eq.false')

        if (usersError) throw usersError

        // Filter Eligible Users (Same logic as Webhook)
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const eligibleUsers = users.filter(user => {
            const leadsToday = user.leads_today || 0;
            const dailyLimit = user.daily_limit || 0;

            // Skip if full, paused, or inactive
            if (leadsToday >= dailyLimit) return false;
            if (dailyLimit <= 0) return false;

            // Subscription check
            const validUntil = user.valid_until ? new Date(user.valid_until) : null;
            if (!validUntil || validUntil < now) return false;

            // Activity check
            const lastActivity = user.last_activity ? new Date(user.last_activity) : null;
            if (!lastActivity || lastActivity < sevenDaysAgo) return false;

            return true;
        });

        if (eligibleUsers.length === 0) {
            console.log('⚠️ No eligible users found for distribution.')
            return new Response(JSON.stringify({ message: 'No eligible users', count: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`👥 Found ${eligibleUsers.length} eligible users.`)

        // 3. Distribution Loop (Round Robin)
        let distributedCount = 0;
        const updates = [];

        // Helper for Round Logic (Simplified for batch process)
        // We just sort once by % filled and distribute round-robin

        // Sort users by "Percent Filled" to fill empty users first
        eligibleUsers.sort((a, b) => {
            const fillA = (a.leads_today || 0) / (a.daily_limit || 1);
            const fillB = (b.leads_today || 0) / (b.daily_limit || 1);
            return fillA - fillB;
        });

        for (const lead of leads) {
            // Find best user (Round Robin style among sorted)
            // We re-sort or just pick next? For 500 leads, re-sorting 100 users every time is expensive?
            // Let's just iterate cyclicly through the sorted list, skipping if they get full

            const userIndex = distributedCount % eligibleUsers.length;
            let user = eligibleUsers[userIndex];

            // Check if user is full (in case they got full during this loop)
            // Since we are iterating, we might overshoot one user if we don't track dynamic counts.
            // Better approach: Find FIRST user who is not full

            user = eligibleUsers.find(u => (u.leads_today || 0) < (u.daily_limit || 0));

            if (!user) {
                console.log('⚠️ All users reached daily limit during processing.')
                break;
            }

            // Assign
            await supabase.from('leads').update({
                user_id: user.id,
                assigned_to: user.id,
                status: 'Assigned',
                assigned_at: new Date().toISOString(),
                notes: (lead.notes || '') + '\n[Auto-Distributed from Backlog]'
            }).eq('id', lead.id);

            // Update local count to prevent over-assigning in this loop
            user.leads_today = (user.leads_today || 0) + 1;

            // Update DB count (optimistic, or batched? We'll update individually for safety)
            await supabase.rpc('increment_leads_today', { user_id: user.id });

            distributedCount++;

            // Re-sort periodically? Or just find next open user (which we do above)
        }

        console.log(`🎉 Distributed ${distributedCount} leads.`)

        return new Response(JSON.stringify({
            success: true,
            distributed: distributedCount,
            remaining_backlog: leads.length - distributedCount
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('❌ Error processing backlog:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
