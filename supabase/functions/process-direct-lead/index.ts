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
        const body = await req.json();

        // 🚨 SPECIAL ADMIN ACTION: DELETE LAST TEST LEAD
        if (body.action === 'delete_last_test') {
            // Find valid test lead
            const { data: lastLead } = await supabase
                .from('leads')
                .select('id, name, phone, created_at')
                .eq('source', 'Web Landing Page')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!lastLead) {
                return new Response(JSON.stringify({ message: 'No test leads found to delete.' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                });
            }

            // Delete it
            await supabase.from('leads').delete().eq('id', lastLead.id);

            return new Response(JSON.stringify({
                message: `Deleted Lead: ${lastLead.name} (${lastLead.phone})`,
                deleted_id: lastLead.id
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        const { name, phone, city, profession, age, manager_ref } = body;

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

        // ============================================================
        // 🚨 PAUSE MODE FIX: ASSIGN TO DUMMY/ADMIN TO SATISFY DB
        // ============================================================

        // 1. Fetch ANY active user (just to get a valid user_id)
        const { data: placeholderUser } = await supabase
            .from('users')
            .select('id')
            .eq('is_active', true)
            .limit(1)
            .single();

        // Fallback ID if no user found (should rarely happen in prod)
        // If DB strictly needs user_id, we MUST provide one.
        const targetUserId = placeholderUser?.id;

        if (!targetUserId) {
            throw new Error("No active users found to park this lead.");
        }

        const notes = `Age: ${age || 'N/A'} | Profession: ${profession || 'N/A'} | Source: Landing Page (Pause Mode)`;

        // 2. Insert with Valid user_id but Status 'New'
        // We do NOT increment their leads_today count.
        const { error: insertError } = await supabase.from('leads').insert({
            name,
            phone: cleanPhone,
            city,
            source: 'Web Landing Page',
            status: 'New', // Parked status
            user_id: targetUserId, // Legal Requirement
            assigned_to: targetUserId,
            notes: notes,
            created_at: new Date().toISOString()
        });

        if (insertError) {
            console.error('Insert Error:', insertError);
            return new Response(JSON.stringify({ error: 'Database Constraint Error: ' + insertError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            });
        }

        return new Response(JSON.stringify({
            message: 'Application Parked Successfully',
            assigned_to: 'Review Queue'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Function Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Something went wrong' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
