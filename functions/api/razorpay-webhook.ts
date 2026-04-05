/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 Razorpay Webhook (Cloudflare Pages Version)            ║
 * ║  SAFE • IMMEDIATE ACTIVATION • LOGS FAILURES • SCALE READY ║
 * ║  Author: LeadFlow CRM                                      ║
 * ╚════════════════════════════════════════════════════════════╝
 */

const PLAN_CONFIG: Record<string, {
    price: number;
    duration: number;
    dailyLeads: number;
    totalLeads: number;
    weight: number;
    maxReplacements: number;
    fresh_count: number;
    recycled_count: number;
}> = {
    starter:      { price: 999,  duration: 10, dailyLeads: 5,  totalLeads: 55,  weight: 1, maxReplacements: 0,  fresh_count: 21, recycled_count: 34 },
    supervisor:   { price: 1999, duration: 15, dailyLeads: 7,  totalLeads: 115, weight: 3, maxReplacements: 0,  fresh_count: 42, recycled_count: 73 },
    manager:      { price: 3499, duration: 20, dailyLeads: 8,  totalLeads: 150, weight: 5, maxReplacements: 16, fresh_count: 76, recycled_count: 74 },
    weekly_boost: { price: 1999, duration: 7,  dailyLeads: 12, totalLeads: 92,  weight: 7, maxReplacements: 8,  fresh_count: 43, recycled_count: 49 },
    turbo_boost:  { price: 2499, duration: 7,  dailyLeads: 14, totalLeads: 108, weight: 9, maxReplacements: 8,  fresh_count: 54, recycled_count: 54 },
    test_plan:    { price: 1,    duration: 1,  dailyLeads: 1,  totalLeads: 1,   weight: 1, maxReplacements: 0,  fresh_count: 1,  recycled_count: 0  }
};

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // Set CORS headers
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
    };

    console.log('[Webhook] ========== REQUEST RECEIVED ==========');
    console.log('[Webhook] Timestamp:', new Date().toISOString());
    console.log('[Webhook] Method:', request.method);
    console.log('[Webhook] URL:', request.url);
    
    try {
        const headersObj: Record<string, string> = {};
        request.headers.forEach((value: string, key: string) => { headersObj[key] = value; });
        console.log('[Webhook] Headers:', JSON.stringify(headersObj));

        const rawBody = await request.text();
        console.log('[Webhook] Body:', rawBody);

        const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_DIRECT_URL || env.VITE_SUPABASE_URL || 'https://vewqzsqddgmkslnuctvb.supabase.co';
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
        console.log('[Webhook] Supabase URL:', supabaseUrl);
        console.log('[Webhook] Service Key exists:', !!supabaseKey);

        if (!webhookSecret || !supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: corsHeaders });
        }

        // 1️⃣ Verify Signature
        const signature = request.headers.get('x-razorpay-signature');

        // Use standard Web Crypto API for Cloudflare Workers/Pages
        const encoder = new TextEncoder();
        const key = await globalThis.crypto.subtle.importKey(
            'raw',
            encoder.encode(webhookSecret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signatureBuffer = await globalThis.crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(rawBody)
        );
        
        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        console.log('[Webhook] Signature from header:', signature);
        console.log('[Webhook] Expected Signature:', expectedSignature);
        console.log('[Webhook] Signature verified:', signature === expectedSignature);

        if (signature !== expectedSignature) {
            console.error('[Webhook] Invalid signature!');
            return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: corsHeaders });
        }

        const body = JSON.parse(rawBody);
        const event = body.event;
        const payload = body.payload?.payment?.entity;

        if (!payload) return new Response(JSON.stringify({ error: 'No payload' }), { status: 400, headers: corsHeaders });

        // ── HANDLE FAILED PAYMENTS ──
        if (event === 'payment.failed') {
            const userId = payload.notes?.user_id;
            if (userId) {
                await fetch(`${supabaseUrl}/rest/v1/payments`, {
                    method: 'POST',
                    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        razorpay_payment_id: payload.id,
                        amount: payload.amount / 100,
                        status: 'failed',
                        plan_name: payload.notes?.plan_name || 'unknown',
                        raw_payload: payload,
                        error_description: payload.error_description || 'Payment Failed'
                    })
                });
            }
            return new Response(JSON.stringify({ status: 'logged_failure' }), { status: 200, headers: corsHeaders });
        }

        // ── HANDLE SUCCESSFUL PAYMENTS (Captured) ──
        if (event === 'payment.captured') {
            // Support both key formats (old: userId/planId, new: user_id/plan_name)
            const userId = payload.notes?.user_id || payload.notes?.userId;
            const planName = payload.notes?.plan_name || payload.notes?.planId;

            if (!userId || !planName) return new Response(JSON.stringify({ error: 'Missing notes' }), { status: 400, headers: corsHeaders });

            const normalizedPlan = planName.toLowerCase().replace(/[\s-]+/g, '_');
            const config = PLAN_CONFIG[normalizedPlan];

            if (!config) return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: corsHeaders });

            // Idempotency Check
            const paymentCheck = await fetch(
                `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${payload.id}&select=id`,
                { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            const existing: any = await paymentCheck.json();
            if (existing?.length) return new Response(JSON.stringify({ success: true, duplicate: true }), { status: 200, headers: corsHeaders });

            // Save Payment
            console.log(`[Webhook] Saving payment for ${userId}, amount: ${payload.amount / 100}, plan: ${normalizedPlan}`);
            const paymentInsertRes = await fetch(`${supabaseUrl}/rest/v1/payments`, {
                method: 'POST',
                headers: { 
                    apikey: supabaseKey, 
                    Authorization: `Bearer ${supabaseKey}`, 
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: userId,
                    razorpay_payment_id: payload.id,
                    amount: payload.amount / 100,
                    plan_name: normalizedPlan,
                    status: 'captured',
                    raw_payload: payload
                })
            });
            const paymentInsertText = await paymentInsertRes.text();
            console.log('[Webhook] Insert result:', { status: paymentInsertRes.status, data: paymentInsertText, error: !paymentInsertRes.ok });

            // Activate User Plan
            console.log('[Webhook] Activating user:', userId, 'Plan:', normalizedPlan);

            // Fetch current total_leads_promised to accumulate correctly on renewal
            const userFetchRes = await fetch(
                `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=total_leads_promised`,
                { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            const userData = await userFetchRes.json();
            const currentTotalLeadsPromised = userData?.[0]?.total_leads_promised || 0;

            // Cumulative: add new plan quota to existing promised leads
            const newTotalLeadsPromised = currentTotalLeadsPromised + config.totalLeads;
            const infiniteValidity = '2099-01-01T00:00:00.000Z';
            const now = new Date();

            const userUpdateRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    plan_name: normalizedPlan,
                    payment_status: 'active',
                    is_active: true,
                    is_new_system: true,
                    daily_limit: config.dailyLeads,              // per-day cap (e.g. 12 for weekly_boost)
                    total_leads_promised: newTotalLeadsPromised, // cumulative += per renewal
                    plan_weight: config.weight,
                    max_replacements: config.maxReplacements,
                    valid_until: infiniteValidity,
                    leads_today: 0,
                    plan_start_date: now.toISOString(),
                    plan_activation_time: null,
                    is_plan_pending: false,
                    is_online: true,
                    updated_at: now.toISOString(),
                    fresh_leads_quota: config.fresh_count,
                    recycled_leads_quota: config.recycled_count,
                    fresh_leads_received: 0,
                    recycled_leads_received: 0
                })
            });

            const userUpdateText = await userUpdateRes.text();
            console.log('[Webhook] User update result:', { status: userUpdateRes.status, data: userUpdateText, error: !userUpdateRes.ok });

            if (!userUpdateRes.ok) {
                console.error('[Webhook] Failed to activate user!', userUpdateText);
            }

            console.log('[Webhook] Sending response:', { success: true });
            return new Response(JSON.stringify({
                success: true,
                status: 'ok',
                plan: normalizedPlan,
                activation: 'immediate'
            }), { status: 200, headers: corsHeaders });
        }

        console.log('[Webhook] Sending response:', { ignored: true });
        return new Response(JSON.stringify({ ignored: true }), { status: 200, headers: corsHeaders });

    } catch (err: any) {
        console.error('[Webhook] ERROR:', err.message, err.stack);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
};

// Handle GET for health checks (if needed, though Pages uses onRequest for specific methods)
export const onRequestGet = async (context: any) => {
    return new Response(JSON.stringify({ status: 'ok', service: 'LeadFlow Webhook v5' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
};

// Handle OPTIONS for CORS explicitly
export const onRequestOptions = async (context: any) => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
            'Access-Control-Max-Age': '86400',
        },
    });
};
