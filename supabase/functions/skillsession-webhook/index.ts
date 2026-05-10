import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * ═══════════════════════════════════════════════════════════════
 * skillsession-webhook — LeadFlow CRM
 * Receives leads from skillsession.in landing page form submissions
 * and inserts them into the leads table, assigned by ref lookup.
 * ═══════════════════════════════════════════════════════════════
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, authorization, x-client-info, apikey',
}

serve(async (req) => {
    // ── OPTIONS preflight (required for browser CORS) ──
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    try {
        const body = await req.json()
        const { name, phone, city, ref, page_url, timestamp } = body

        // ── 1. VALIDATION ──
        if (!name || !phone || !ref) {
            return new Response(
                JSON.stringify({ success: false, error: 'name, phone, and ref are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Clean phone — keep last 10 digits only
        const cleanPhone = (phone as string).replace(/\D/g, '').slice(-10)
        if (!/^[6789]\d{9}$/.test(cleanPhone)) {
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid Indian phone number' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 2. DUPLICATE CHECK ──
        const { data: dup } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', cleanPhone)
            .limit(1)

        if (dup && dup.length > 0) {
            // Return success silently — don't expose duplicate info to public form
            console.log(`[skillsession] Duplicate skipped: ${cleanPhone}`)
            return new Response(
                JSON.stringify({ success: true, message: 'Lead received' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ── 3. REF LOOKUP ──
        // Match ref against user name (case-insensitive partial match)
        let assignedUserId: string | null = null

        const { data: refUser } = await supabase
            .from('users')
            .select('id, name')
            .ilike('name', `%${ref}%`)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle()

        if (refUser) {
            assignedUserId = refUser.id
            console.log(`[skillsession] ref "${ref}" -> user: ${refUser.name} (${refUser.id})`)
        } else {
            // Fallback: assign to admin
            const { data: adminUser } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin')
                .limit(1)
                .maybeSingle()

            assignedUserId = adminUser?.id ?? null
            console.log(`[skillsession] ref "${ref}" not found — fallback admin: ${assignedUserId}`)
        }

        if (!assignedUserId) {
            throw new Error('No eligible user and no admin fallback available')
        }

        // ── 4. INSERT LEAD ──
        // ref_code and page_url stored in notes (not separate columns in leads table)
        const notes = `Ref: ${ref} | Page: ${page_url || 'N/A'} | Source: skillsession.in`
        const leadTimestamp = timestamp
            ? new Date(timestamp).toISOString()
            : new Date().toISOString()

        const { error: insertError } = await supabase.from('leads').insert({
            name:        (name as string).trim(),
            phone:       cleanPhone,
            city:        city || 'Unknown',
            source:      'skillsession_landing',
            status:      'New',
            assigned_to: assignedUserId,
            user_id:     assignedUserId,   // legacy FK — same as assigned_to
            notes,
            created_at:  leadTimestamp,
            lead_type:   'fresh',
            recycle_count: 0,
        })

        if (insertError) {
            console.error('[skillsession] Insert error:', insertError.message)
            throw new Error(insertError.message)
        }

        console.log(`[skillsession] ✅ Lead saved: ${name} (${cleanPhone}) -> ref: ${ref} -> ${assignedUserId}`)

        return new Response(
            JSON.stringify({ success: true, message: 'Lead received' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err: any) {
        console.error('[skillsession] Fatal error:', err.message)
        return new Response(
            JSON.stringify({ success: false, error: 'Internal error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
