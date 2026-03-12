/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 Razorpay Webhook (Cloudflare Pages Version)            ║
 * ║  SAFE • IMMEDIATE ACTIVATION • LOGS FAILURES • SCALE READY ║
 * ║  Author: LeadFlow CRM                                     ║
 * ╚════════════════════════════════════════════════════════════╝
 */

const PLAN_CONFIG: Record<string, {
    price: number;
    duration: number;
    dailyLeads: number;
    totalLeads: number;
    weight: number;
    maxReplacements: number;
}> = {
    starter: { price: 999, duration: 10, dailyLeads: 5, totalLeads: 55, weight: 1, maxReplacements: 5 },
    supervisor: { price: 1999, duration: 15, dailyLeads: 7, totalLeads: 115, weight: 3, maxReplacements: 10 },
    manager: { price: 2999, duration: 20, dailyLeads: 8, totalLeads: 176, weight: 5, maxReplacements: 16 },
    weekly_boost: { price: 1999, duration: 7, dailyLeads: 12, totalLeads: 92, weight: 7, maxReplacements: 8 },
    turbo_boost: { price: 2499, duration: 7, dailyLeads: 14, totalLeads: 108, weight: 9, maxReplacements: 10 }
};

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // Set CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
    };

    try {
        const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
        const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

        if (!webhookSecret || !supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: corsHeaders });
        }

        // 1️⃣ Verify Signature
        const signature = request.headers.get('x-razorpay-signature');
        const rawBody = await request.text();

        // Use Web Crypto API or Node crypto (Cloudflare supports Node.js compatibility)
        // For Cloudflare, we can import crypto or use SubtleCrypto.
        // However, the user asked to copy the logic. Cloudflare supports Node crypto via `import crypto from 'node:crypto'`.
        const crypto = await import('node:crypto');
        const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

        if (signature !== expectedSignature) {
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
            const userId = payload.notes?.user_id;
            const planName = payload.notes?.plan_name;

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
            await fetch(`${supabaseUrl}/rest/v1/payments`, {
                method: 'POST',
                headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    razorpay_payment_id: payload.id,
                    amount: payload.amount / 100,
                    plan_name: normalizedPlan,
                    status: 'captured',
                    raw_payload: payload
                })
            });

            // Activate User Plan
            const now = new Date();
            // Infinite Validity (2099)
            const infiniteValidity = '2099-01-01T00:00:00.000Z';

            // Get REAL all-time leads count from DB
            const leadsCountRes = await fetch(
                `${supabaseUrl}/rest/v1/leads?user_id=eq.${userId}&select=*&head=true`,
                { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            const realLeadsCount = parseInt(leadsCountRes.headers.get('content-range')?.split('/')[1] || '0');

            // CUMULATIVE QUOTA: old leads + new plan
            // Example: user had 50 leads (Jan/Feb), buys Starter (55) → promised = 105
            // check-renewals counts real leads, so user gets exactly 55 new leads
            const newTotalLeadsPromised = realLeadsCount + config.totalLeads;

            // 🚀 IMMEDIATE ACTIVATION LOGIC
            await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
                method: 'PATCH',
                headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_name: normalizedPlan,
                    payment_status: 'active',
                    is_active: true,
                    daily_limit: config.dailyLeads,
                    total_leads_promised: newTotalLeadsPromised,  // ✅ CUMULATIVE (old + new plan)
                    total_leads_received: realLeadsCount,         // ✅ REAL all-time count
                    plan_weight: config.weight,
                    max_replacements: config.maxReplacements,
                    valid_until: infiniteValidity,
                    leads_today: 0,
                    plan_start_date: now.toISOString(),
                    plan_activation_time: null,
                    is_plan_pending: false,
                    is_online: true,
                    updated_at: now.toISOString()
                })
            });

            return new Response(JSON.stringify({
                success: true,
                status: 'ok',
                plan: normalizedPlan,
                activation: 'immediate'
            }), { status: 200, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ ignored: true }), { status: 200, headers: corsHeaders });

    } catch (err: any) {
        console.error('Webhook error:', err.message);
        return new Response(JSON.stringify({ error: 'Webhook crash', message: err.message }), { status: 500, headers: corsHeaders });
    }
};

// Handle GET for health checks (if needed, though Pages uses onRequest for specific methods)
export const onRequestGet = async (context: any) => {
    return new Response(JSON.stringify({ status: 'ok', service: 'LeadFlow Webhook v5' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
};

// Handle OPTIONS for CORS
export const onRequestOptions = async () => {
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
