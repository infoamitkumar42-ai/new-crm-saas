/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 Razorpay Webhook v5 – WITH FAILURE TRACKING           ║
 * ║  SAFE • IDPOTENT • LOGS FAILURES • SCALE READY            ║
 * ║  Author: LeadFlow CRM                                     ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import crypto from 'crypto';

// ✅ Vercel body parser disable karo — raw body chahiye HMAC ke liye
export const config = {
  api: { bodyParser: false }
};

// ✅ Helper: raw body string read karo req stream se
async function getRawBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ... (PLAN_CONFIG same rahega, usme change nahi hai) ...
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ status: 'ok', service: 'LeadFlow Webhook v5' });
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Expects RAZORPAY_WEBHOOK_SECRET to be set in Vercel Environment Variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!webhookSecret || !supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // 1️⃣ Verify Signature — raw body use karo (parsed body se HMAC galat hoga)
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = await getRawBody(req);
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const parsedBody = JSON.parse(rawBody);
    const event = parsedBody.event;
    const payload = parsedBody.payload?.payment?.entity;

    if (!payload) return res.status(400).json({ error: 'No payload' });

    // ─────────────────────────────────────────────
    // 🔴 HANDLE FAILED PAYMENTS
    // ─────────────────────────────────────────────
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
            status: 'failed', // 🔥 Marked as failed
            plan_name: payload.notes?.plan_name || 'unknown',
            raw_payload: payload,
            error_description: payload.error_description || 'Payment Failed'
          })
        });
      }
      return res.status(200).json({ status: 'logged_failure' });
    }

    // ─────────────────────────────────────────────
    // 🟢 HANDLE SUCCESSFUL PAYMENTS (Captured)
    // ─────────────────────────────────────────────
    if (event === 'payment.captured') {
      const userId = payload.notes?.user_id;
      const planName = payload.notes?.plan_name;

      if (!userId || !planName) return res.status(400).json({ error: 'Missing notes' });

      const normalizedPlan = planName.toLowerCase().replace(/[\s-]+/g, '_');
      const config = PLAN_CONFIG[normalizedPlan];

      if (!config) return res.status(400).json({ error: 'Invalid plan' });

      // Idempotency Check
      const paymentCheck = await fetch(
        `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${payload.id}&select=id`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const existing = await paymentCheck.json();
      if (existing?.length) return res.status(200).json({ success: true, duplicate: true });

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
      const validUntil = new Date();
      validUntil.setDate(now.getDate() + config.duration);

      // 🆕 Calculate plan activation time (30 minutes from now)
      // New users get 30 minute delay for fair distribution
      const activationTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

      // Check if user was already active (renewal vs new purchase)
      const existingUser = await fetch(
        `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=plan_name,payment_status,total_leads_promised`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const existingData = await existingUser.json();
      const userData = existingData?.[0];
      const isRenewal = userData?.payment_status === 'active' && userData?.plan_name !== 'none';

      // 🚀 ROBUST ALL-TIME SYNC LOGIC (Cumulative Counter)

      // 1. Get REAL all-time leads count from DB
      const { count: realLeadsCount } = await fetch(
        `${supabaseUrl}/rest/v1/leads?user_id=eq.${userId}&select=*&head=true`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      ).then(r => ({ count: parseInt(r.headers.get('content-range')?.split('/')[1] || '0') }));

      // 2. CUMULATIVE QUOTA — Old leads count + new plan leads
      // Example: User had 50 leads (Jan/Feb), buys Starter (55) → promised = 105
      // check-renewals uses real leads count, so user gets exactly 55 new leads
      const newTotalLeadsPromised = realLeadsCount + config.totalLeads;

      // 3. total_leads_received = real all-time count (for accurate display)
      // New user: 0 + plan = plan total
      // Old user: 50 + plan = cumulative total
      const newTotalLeadsReceived = realLeadsCount;

      // 4. Infinite Validity (2099)
      const infiniteValidity = '2099-01-01T00:00:00.000Z'; // Never expire by date

      await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: normalizedPlan,
          payment_status: 'active',
          is_active: true,
          daily_limit: config.dailyLeads,
          total_leads_promised: newTotalLeadsPromised,   // ✅ CUMULATIVE (old + new plan)
          total_leads_received: newTotalLeadsReceived,   // ✅ REAL all-time count
          plan_weight: config.weight,
          max_replacements: config.maxReplacements,
          valid_until: infiniteValidity,
          leads_today: 0,
          plan_start_date: now.toISOString(),
          plan_activation_time: isRenewal ? null : activationTime.toISOString(),
          is_plan_pending: isRenewal ? false : true,
          is_online: true,
          updated_at: now.toISOString()
        })
      });

      return res.status(200).json({
        success: true,
        plan: normalizedPlan,
        activation_time: isRenewal ? 'immediate' : activationTime.toISOString(),
        is_pending: !isRenewal
      });
    }

    return res.status(200).json({ ignored: true });

  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ error: 'Webhook crash' });
  }
}
