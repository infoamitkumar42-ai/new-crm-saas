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
    starter:      { price: 999,  duration: 10, dailyLeads: 5,  totalLeads: 50,  weight: 1, maxReplacements: 5,  fresh_count: 21, recycled_count: 34 },
    supervisor:   { price: 1499, duration: 15, dailyLeads: 7,  totalLeads: 80,  weight: 3, maxReplacements: 10, fresh_count: 70, recycled_count: 10 },
    manager:      { price: 2999, duration: 20, dailyLeads: 8,  totalLeads: 160, weight: 5, maxReplacements: 16, fresh_count: 76, recycled_count: 74 },
    weekly_boost: { price: 1999, duration: 7,  dailyLeads: 12, totalLeads: 92,  weight: 7, maxReplacements: 8,  fresh_count: 80, recycled_count: 12 },
    turbo_boost:  { price: 2499, duration: 7,  dailyLeads: 14, totalLeads: 108, weight: 9, maxReplacements: 10, fresh_count: 93, recycled_count: 15 },
    test_plan:    { price: 1,    duration: 1,  dailyLeads: 1,  totalLeads: 1,   weight: 1, maxReplacements: 0,  fresh_count: 1,  recycled_count: 0  },
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
        
        const rawBody = await request.text();
        console.log('[Webhook] Body Length:', rawBody.length);

        const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || env.VITE_RAZORPAY_WEBHOOK_SECRET;
        // Always use direct Supabase URL — never the ISP-bypass proxy (api.leadflowcrm.in)
        // Proxy is for frontend only; server-side functions reach Supabase directly
        const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!webhookSecret || !supabaseUrl || !supabaseKey) {
            console.error('[Webhook] CRITICAL: Environment variables missing!');
            return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: corsHeaders });
        }

        // 1️⃣ Verify Signature
        const signature = request.headers.get('x-razorpay-signature');
        if (!signature) {
            console.error('[Webhook] Missing x-razorpay-signature header');
            return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401, headers: corsHeaders });
        }

        const encoder = new TextEncoder();
        const hmacKey = await globalThis.crypto.subtle.importKey(
            'raw',
            encoder.encode(webhookSecret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signatureBuffer = await globalThis.crypto.subtle.sign(
            'HMAC',
            hmacKey,
            encoder.encode(rawBody)
        );
        
        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        if (signature !== expectedSignature) {
            console.error('[Webhook] Signature Mismatch!');
            console.log('[Webhook] Received:', signature.substring(0, 10) + '...');
            console.log('[Webhook] Expected:', expectedSignature.substring(0, 10) + '...');
            return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: corsHeaders });
        }

        const body = JSON.parse(rawBody);
        const event = body.event;
        const payload = body.payload?.payment?.entity;

        console.log(`[Webhook] Processing Event: ${event} | Payment ID: ${payload?.id}`);

        if (!payload) return new Response(JSON.stringify({ error: 'No payload' }), { status: 400, headers: corsHeaders });

        // ── HANDLE FAILED PAYMENTS ──
        if (event === 'payment.failed') {
            const userId = payload.notes?.user_id;
            console.warn(`[Webhook] Payment Failed for User: ${userId} | Reason: ${payload.error_description}`);
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
        if (event === 'payment.captured' || event === 'payment.authorized') {
            const userId = payload.notes?.user_id || payload.notes?.userId;
            const planName = payload.notes?.plan_name || payload.notes?.planId;
            const teamCode = payload.notes?.team_code || null;

            console.log(`[Webhook] Success Event: ${event} | User: ${userId} | Plan: ${planName}`);

            if (!userId || !planName) {
                console.error('[Webhook] Error: Missing user_id or plan_name in notes!');
                return new Response(JSON.stringify({ error: 'Missing notes' }), { status: 400, headers: corsHeaders });
            }

            const normalizedPlan = planName.toLowerCase().replace(/[\s-]+/g, '_');
            const config = PLAN_CONFIG[normalizedPlan];

            if (!config) {
                console.error(`[Webhook] Error: Plan "${normalizedPlan}" not found in config!`);
                return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: corsHeaders });
            }

            // Idempotency Check (Check if already processed)
            const paymentCheck = await fetch(
                `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${payload.id}&select=id`,
                { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            const existing: any = await paymentCheck.json();
            if (existing?.length) {
                console.log(`[Webhook] Skipping: Payment ${payload.id} already processed.`);
                return new Response(JSON.stringify({ success: true, duplicate: true }), { status: 200, headers: corsHeaders });
            }

            // 1️⃣ Save Payment to DB
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
            
            if (!paymentInsertRes.ok) {
                const errText = await paymentInsertRes.text();
                console.error('[Webhook] DB Error (Payment Insert):', errText);
            }

            // 2️⃣ Activate User Plan
            console.log(`[Webhook] Starting Activation for User ${userId}...`);

            // Fetch current counters and team_code to preserve on renewal
            const userFetchRes = await fetch(
                `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=total_leads_promised,total_leads_received,team_code`,
                { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            
            if (!userFetchRes.ok) {
                console.error('[Webhook] DB Error (User Fetch):', await userFetchRes.text());
            }

            const userData = await userFetchRes.json();
            const currentTotalLeadsPromised = userData?.[0]?.total_leads_promised || 0;
            const currentTotalLeadsReceived = userData?.[0]?.total_leads_received || 0;
            const existingTeamCode = userData?.[0]?.team_code || null;
            const resolvedTeamCode = existingTeamCode || teamCode;

            // Safe cumulative: use max(received, promised) as baseline so any historical
            // corruption in total_leads_promised never causes instant plan expiry on activation.
            // e.g. if promised=92 but received=482, baseline=482, new=482+92=574 (correct).
            const baseline = Math.max(currentTotalLeadsReceived, currentTotalLeadsPromised);
            const newTotalLeadsPromised = baseline + config.totalLeads;
            const infiniteValidity = '2099-01-01T00:00:00.000Z';
            const now = new Date();

            // Tomorrow 7:00 AM IST logic
            const istOffsetMs = 5.5 * 60 * 60 * 1000;
            const tomorrowIST = new Date(now.getTime() + istOffsetMs);
            tomorrowIST.setUTCDate(tomorrowIST.getUTCDate() + 1);
            tomorrowIST.setUTCHours(1, 30, 0, 0); // 01:30 UTC = 07:00 IST
            const activationTime = tomorrowIST.toISOString();

            const userUpdateRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan_name: normalizedPlan,
                    payment_status: 'active',
                    is_active: false,
                    is_online: false,
                    is_plan_pending: true,
                    plan_activation_time: activationTime,
                    is_new_system: true,
                    daily_limit: config.dailyLeads,
                    total_leads_promised: newTotalLeadsPromised,
                    plan_weight: config.weight,
                    max_replacements: config.maxReplacements,
                    valid_until: infiniteValidity,
                    leads_today: 0,
                    plan_start_date: now.toISOString(),
                    updated_at: now.toISOString(),
                    fresh_leads_quota: config.fresh_count,
                    recycled_leads_quota: config.recycled_count,
                    fresh_leads_received: 0,
                    recycled_leads_received: 0,
                    ...(resolvedTeamCode ? { team_code: resolvedTeamCode } : {})
                })
            });

            if (!userUpdateRes.ok) {
                const updateErr = await userUpdateRes.text();
                console.error(`[Webhook] CRITICAL: Failed to update user ${userId}:`, updateErr);
                return new Response(JSON.stringify({ error: 'Activation failed' }), { status: 500, headers: corsHeaders });
            }

            console.log(`[Webhook] ✅ Successfully activated User ${userId} for Plan ${normalizedPlan}`);
            return new Response(JSON.stringify({
                success: true,
                status: 'activated',
                payment_id: payload.id
            }), { status: 200, headers: corsHeaders });
        }

        console.log(`[Webhook] Event ${event} ignored.`);
        return new Response(JSON.stringify({ ignored: true }), { status: 200, headers: corsHeaders });

    } catch (err: any) {
        console.error('[Webhook] UNEXPECTED SYSTEM ERROR:', err.message);
        return new Response(JSON.stringify({ error: 'Internal system error' }), { status: 500, headers: corsHeaders });
    }
};

// Handle GET for health checks
export const onRequestGet = async (context: any) => {
    return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'LeadFlow Webhook v5.1', 
        timestamp: new Date().toISOString() 
    }), {
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
