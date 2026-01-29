import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * PROCESS DIRECT LEAD (Landing Page)
 * 
 * Handles leads submitting via the /apply page.
 * Logic:
 * 1. Validate Input (Name, Phone, City)
 * 2. Check Duplicates
 * 3. Smart Distribution (Round Robin)
 *    - If manager_ref is provided -> Route to that Manager's Team
 *    - Else -> Route to Global Active Users
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
        const { name, phone, city, profession, age, manager_ref } = await req.json();

        // 1. VALIDATION
        if (!name || !phone) {
            return new Response(JSON.stringify({ error: 'Name and Phone are required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        // Clean phone (keep last 10 digits)
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        if (!/^[6789]\d{9}$/.test(cleanPhone)) {
            return new Response(JSON.stringify({ error: 'Invalid Indian Phone Number' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        // 2. DUPLICATE CHECK
        const { data: dup } = await supabase.from('leads').select('id').eq('phone', cleanPhone).limit(1);
        if (dup && dup.length > 0) {
            return new Response(JSON.stringify({ error: 'Already Registered' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 409 // Conflict
            });
        }

        // 3. FIND ELIGIBLE USERS
        let query = supabase.from('users').select('*').eq('is_active', true).eq('payment_status', 'active').gt('daily_limit', 0);

        // Manager Routing Logic
        if (manager_ref) {
            // Find manager ID by name (case insensitive)
            const { data: manager } = await supabase.from('users')
                .select('id')
                .ilike('name', `%${manager_ref}%`)
                .limit(1)
                .single();

            if (manager) {
                // Filter users who report to this manager
                query = query.eq('manager_id', manager.id);
            }
        }

        const { data: users } = await query;
        let eligibleUsers = [];

        // 4. CHECK QUOTA (Real-time)
        // Helper to get real count
        const getRealTodayCount = async (uid) => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
            const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
                .eq('user_id', uid).gte('created_at', todayStart).lt('created_at', tomorrowStart);
            return count || 0;
        };

        for (const u of users || []) {
            const count = await getRealTodayCount(u.id);
            if (count < (u.daily_limit || 0)) {
                eligibleUsers.push({ ...u, real_leads_today: count });
            }
        }

        const notes = `Age: ${age || 'N/A'} | Profession: ${profession || 'N/A'}`;

        if (eligibleUsers.length === 0) {
            // Fallback: If manager team is full, try Global? Or just fail?
            // Let's Insert as 'New' (Unassigned)
            await supabase.from('leads').insert({
                name,
                phone: cleanPhone,
                city,
                source: 'Web Landing Page',
                status: 'New', // Waiting
                notes: notes,
                created_at: new Date().toISOString()
            });

            return new Response(JSON.stringify({ message: 'Success (Queue)' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // 5. SORT & PICK (Round Robin)
        // Sort by plan weight (higher first), then least leads today
        const getPlanWeight = (p) => {
            const plan = (p || '').toLowerCase();
            if (plan.includes('turbo')) return 100;
            if (plan.includes('weekly')) return 90;
            if (plan.includes('manager')) return 80;
            if (plan.includes('supervisor')) return 70;
            return 10;
        };

        eligibleUsers.sort((a, b) => {
            const wDiff = getPlanWeight(b.plan_name) - getPlanWeight(a.plan_name);
            if (wDiff !== 0) return wDiff;
            return a.real_leads_today - b.real_leads_today;
        });

        const selectedUser = eligibleUsers[0];
        const newCount = selectedUser.real_leads_today + 1;

        // 6. ASSIGN
        await supabase.from('leads').insert({
            name,
            phone: cleanPhone,
            city,
            source: 'Web Landing Page',
            status: 'Assigned',
            user_id: selectedUser.id,
            assigned_to: selectedUser.id,
            notes: notes,
            created_at: new Date().toISOString()
        });

        // Update counter
        await supabase.from('users').update({ leads_today: newCount }).eq('id', selectedUser.id);

        return new Response(JSON.stringify({
            message: 'Assigned',
            assigned_to: selectedUser.name.split(' ')[0]
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
