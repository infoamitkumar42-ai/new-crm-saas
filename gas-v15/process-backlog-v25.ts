
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ----------------------------------------------------------------------
// HELPER: Infer State from Phone (Simplified Copy)
// ----------------------------------------------------------------------
function inferStateFromPhone(phone: string): string {
    if (!phone) return 'Unknown';
    const p = phone.replace('+91', '').trim();

    const startingDigits = p.substring(0, 4);

    // Punjab
    if (['9814', '9815', '9872', '9876', '9878', '9914', '9915', '9988', '9417', '9463', '9464', '9465', '8146', '8194', '9501', '9855'].some(pre => p.startsWith(pre))) return 'Punjab';

    // Delhi
    if (['9810', '9811', '9818', '9868', '9871', '9910', '9958', '9999'].some(pre => p.startsWith(pre))) return 'Delhi';

    // Haryana
    if (['9812', '9813', '9896', '9991', '9992', '9416', '9466', '9467'].some(pre => p.startsWith(pre))) return 'Haryana';

    return 'Unknown';
}
// ----------------------------------------------------------------------

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

        console.log('🧹 Backlog Sweeper Started (2-Lead Batch Mode)...')

        // 1. Fetch 'New' Leads (Oldest First)
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .eq('status', 'New')
            .order('created_at', { ascending: true })
            .limit(100); // Process 100 at a time

        if (leadsError) throw leadsError
        if (!leads || leads.length === 0) {
            console.log('✅ queue empty')
            return new Response(JSON.stringify({ message: 'Queue Empty', count: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`📦 Processing ${leads.length} stuck leads...`);

        // 2. Fetch Active Users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('is_active', true)
            .neq('plan_name', 'none')
            .or('is_plan_pending.is.null,is_plan_pending.eq.false');

        if (usersError) throw usersError

        // Global Debug Vars
        let firstLeadRejections = { capacity: 0, manager: 0, state: 0, total_users: users.length };
        let distributedCount = 0;

        // 3. Process Each Lead
        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];
            // A. Determine Context
            let manager_id = null;
            let leadState = lead.state;

            // Map Source -> Manager
            if (lead.source?.includes("Himanshu")) {
                manager_id = "79c67296-b221-4ca9-a3a5-1611e690e68d";
            }

            // Infer State
            if (!leadState || leadState === 'Unknown') {
                leadState = inferStateFromPhone(lead.phone);
            }

            // B. Filter Eligible Users
            let eligible = users.filter(u => {
                // 1. Capacity
                const limit = u.daily_limit || 0;
                const current = u.leads_today || 0;
                if (current >= limit) {
                    if (i === 0) firstLeadRejections.capacity++;
                    return false;
                }

                // 2. Manager (Hierarchy)
                if (manager_id) {
                    const isHimanshu = (u.id === manager_id);
                    const isHimanshuTeam = (u.manager_id === manager_id);
                    const isSimran = (u.id === 'ff0ead1f-212c-4e89-bc81-dec4185f8853'); // Simran
                    const isSimranTeam = (u.manager_id === 'ff0ead1f-212c-4e89-bc81-dec4185f8853');
                    const isSimranSimmi = (u.id === '5cca04ae-3d29-4efe-a12a-0b01336cddee'); // Simran Simmi

                    if (!isHimanshu && !isHimanshuTeam && !isSimran && !isSimranTeam && !isSimranSimmi) {
                        if (i === 0) firstLeadRejections.manager++;
                        return false;
                    }
                }

                // 3. State
                if (leadState && leadState !== 'Unknown') {
                    const userFilters = u.filters || {};
                    // Check Pan India (support both keys seen in DB)
                    const isPanIndia = userFilters.panIndia === true || userFilters.pan_india === true;

                    if (isPanIndia) return true;

                    // Check Specific States
                    const allowedStates = userFilters.states || [];
                    const hasState = allowedStates.some((s: string) => s.toLowerCase() === leadState.toLowerCase());

                    if (hasState) return true;

                    // Fallback: If 'target_state' column exists and says "All India"
                    if (u.target_state === 'All India') return true;

                    if (i === 0) firstLeadRejections.state++;
                    return false;
                }

                return true;
            });

            if (eligible.length === 0) {
                continue;
            }

            // C. STRICT 2-LEAD BATCH ROTATION SORT
            // ==========================================
            const getPlanWeight = (plan: string) => {
                const p = (plan || '').toLowerCase();
                if (p.includes('turbo')) return 100;
                if (p.includes('manager')) return 90;
                if (p.includes('supervisor')) return 80;
                if (p.includes('weekly')) return 70;
                if (p.includes('starter')) return 60;
                return 0; // Unknown/None
            };

            eligible.sort((a, b) => {
                const leadsA = a.leads_today || 0;
                const leadsB = b.leads_today || 0;

                // Condition 1: COMPLETE THE PAIR (Odd Priority)
                const aNeedsCompletion = leadsA % 2 !== 0;
                const bNeedsCompletion = leadsB % 2 !== 0;
                if (aNeedsCompletion && !bNeedsCompletion) return -1;
                if (!aNeedsCompletion && bNeedsCompletion) return 1;

                // Condition 2: ROUND BALANCING (Pairs Check)
                if (leadsA !== leadsB) return leadsA - leadsB;

                // Condition 3: HIERARCHY (Plan Weight)
                const weightA = getPlanWeight(a.plan_name);
                const weightB = getPlanWeight(b.plan_name);
                if (weightA !== weightB) return weightB - weightA;

                // Condition 4: Stable Tie-Breaker
                return (a.id || '').localeCompare(b.id || '');
            });

            // D. Assign (Strictly Top 1)
            let selectedUser = eligible[0]; // Top priority user

            // Double Check DB Status (Race Condition Guard)
            const { data: freshUser, error: freshErr } = await supabase
                .from('users')
                .select('leads_today, daily_limit')
                .eq('id', selectedUser.id)
                .single();

            if (freshErr || !freshUser) continue;

            // Sync local state if DB changed (e.g. allocated by webhook parallelly)
            if (freshUser.leads_today !== selectedUser.leads_today) {
                selectedUser.leads_today = freshUser.leads_today;
                // Re-validate limit
                if (selectedUser.leads_today >= (selectedUser.daily_limit || 0)) {
                    continue; // Skip if full
                }
            }

            // Execute Assignment
            const { error: assignError, data: updateData } = await supabase
                .from('leads')
                .update({
                    status: 'Assigned',
                    user_id: selectedUser.id,
                    assigned_to: selectedUser.id,
                    assigned_at: new Date().toISOString()
                })
                .eq('id', lead.id)
                .eq('status', 'New') // Safety check
                .select();

            if (!assignError && updateData && updateData.length > 0) {
                console.log(`✅ Assigned ${lead.phone.slice(-4)} -> ${selectedUser.name}`);

                // Critical: Direct Update to stop loop
                const { error: cntErr } = await supabase
                    .from('users')
                    .update({ leads_today: (selectedUser.leads_today || 0) + 1, updated_at: new Date().toISOString() })
                    .eq('id', selectedUser.id);

                if (cntErr) console.error('❌ User Count Update Failed:', cntErr);

                // Update local cache for NEXT iteration (CRITICAL for batching loops)
                selectedUser.leads_today = (selectedUser.leads_today || 0) + 1;
                distributedCount++;
            }
        }

        return new Response(JSON.stringify({
            message: 'Success',
            distributed: distributedCount,
            debug: {
                leads_found: leads.length,
                users_active: users.length,
                first_lead_stats: firstLeadRejections
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('❌ Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
})
