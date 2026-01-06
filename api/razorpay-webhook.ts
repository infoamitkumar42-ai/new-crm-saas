/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 Razorpay Webhook v4 – PRODUCTION READY                ║
 * ║  SAFE • IDPOTENT • NO AUTO-REFUND • SCALE READY           ║
 * ║  Author: LeadFlow CRM                                     ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import crypto from 'crypto';

// ─────────────────────────────────────────────
// PLAN CONFIG (Single Source of Truth)
// ─────────────────────────────────────────────
const PLAN_CONFIG: Record<string, {
  price: number;
  duration: number;
  dailyLeads: number;
  totalLeads: number;
  weight: number;
  maxReplacements: number;
}> = {
  starter: {
    price: 999,
    duration: 10,
    dailyLeads: 5,
    totalLeads: 50,
    weight: 1,
    maxReplacements: 5
  },
  supervisor: {
    price: 1999,
    duration: 15,
    dailyLeads: 7,
    totalLeads: 105,
    weight: 3,
    maxReplacements: 10
  },
  manager: {
    price: 2999,
    duration: 20,
    dailyLeads: 8,
    totalLeads: 160,
    weight: 5,
    maxReplacements: 16
  },
  weekly_boost: {
    price: 1999,
    duration: 7,
    dailyLeads: 12,
    totalLeads: 84,
    weight: 7,
    maxReplacements: 8
  },
  turbo_boost: {
    price: 2499,
    duration: 7,
    dailyLeads: 14,
    totalLeads: 98,
    weight: 9,
    maxReplacements: 10
  }
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ───── Health Check ─────
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'LeadFlow Razorpay Webhook',
      version: 'v4'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!webhookSecret || !supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // ─────────────────────────────────────────────
    // 1️⃣ VERIFY SIGNATURE (MANDATORY)
    // ─────────────────────────────────────────────
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid Razorpay signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // ─────────────────────────────────────────────
    // 2️⃣ PROCESS ONLY payment.captured
    // ─────────────────────────────────────────────
    if (req.body.event !== 'payment.captured') {
      return res.status(200).json({ ignored: true });
    }

    const payment = req.body.payload?.payment?.entity;
    if (!payment) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // ─────────────────────────────────────────────
    // 3️⃣ STRICT NOTES VALIDATION
    // ─────────────────────────────────────────────
    const userId = payment.notes?.user_id;
    const planName = payment.notes?.plan_name;

    if (!userId || !planName) {
      console.error('❌ Missing notes', payment.notes);
      return res.status(400).json({ error: 'Missing user_id or plan_name in notes' });
    }

    const normalizedPlan = planName.toLowerCase().replace(/[\s-]+/g, '_');
    const config = PLAN_CONFIG[normalizedPlan];

    if (!config) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const amountPaid = payment.amount / 100;
    if (amountPaid !== config.price) {
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // ─────────────────────────────────────────────
    // 4️⃣ IDEMPOTENCY CHECK (NO DOUBLE PROCESS)
    // ─────────────────────────────────────────────
    const paymentCheck = await fetch(
      `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${payment.id}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    );

    const existing = await paymentCheck.json();
    if (existing?.length) {
      return res.status(200).json({ success: true, duplicate: true });
    }

    // ─────────────────────────────────────────────
    // 5️⃣ SAVE PAYMENT RECORD
    // ─────────────────────────────────────────────
    await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        razorpay_payment_id: payment.id,
        amount: amountPaid,
        plan_name: normalizedPlan,
        status: 'captured',
        raw_payload: payment
      })
    });

    // ─────────────────────────────────────────────
    // 6️⃣ ACTIVATE PLAN
    // ─────────────────────────────────────────────
    const now = new Date();
    const validUntil = new Date();
    validUntil.setDate(now.getDate() + config.duration);
    validUntil.setHours(23, 59, 59, 999);

    const updateUser = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_name: normalizedPlan,
          payment_status: 'active',
          daily_limit: config.dailyLeads,
          plan_weight: config.weight,
          max_replacements: config.maxReplacements,
          valid_until: validUntil.toISOString(),
          leads_today: 0,

          plan_start_date: now.toISOString(),
          original_plan_days: config.duration,
          days_extended: 0,
          total_leads_promised: config.totalLeads,
          total_leads_received: 0,

          updated_at: now.toISOString()
        })
      }
    );

    if (!updateUser.ok) {
      return res.status(500).json({ error: 'User update failed' });
    }

    // ─────────────────────────────────────────────
    // ✅ SUCCESS
    // ─────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      plan: normalizedPlan,
      validUntil: validUntil.toISOString()
    });

  } catch (err: any) {
    console.error('❌ Webhook crash:', err.message);
    return res.status(500).json({ error: 'Webhook error' });
  }
}
