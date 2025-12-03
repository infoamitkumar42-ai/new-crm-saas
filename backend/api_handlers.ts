import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const shasum = crypto.createHmac('sha256', secret!);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest === req.headers['x-razorpay-signature']) {
      const event = req.body.event;
      const payload = req.body.payload.payment.entity;

      if (event === 'payment.captured') {
        const email = payload.email; // Assuming email is passed in notes or prefill
        const amount = payload.amount;
        const razorpayId = payload.id;
        
        // Determine Plan Duration based on amount (Simplified logic)
        let durationDays = 0;
        let planType = '';
        if (amount === 1500) { durationDays = 1; planType = 'daily'; }
        if (amount === 9000) { durationDays = 7; planType = 'weekly'; }
        if (amount === 29900) { durationDays = 30; planType = 'monthly'; }

        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + durationDays);

        // Update User Status
        const { data: user, error } = await supabase
          .from('users')
          .update({ 
            payment_status: 'active',
            valid_until: validUntil.toISOString(),
            plan_type: planType
          })
          .eq('email', email)
          .select('id')
          .single();

        if (error) {
          console.error('Database update failed', error);
          // Log system error
          await supabase.from('logs').insert({
            action: 'system_error',
            details: { context: 'payment_webhook', error: error.message, payload: req.body }
          });
          return res.status(500).json({ status: 'error' });
        }

        // Log payment success in DB
        await supabase.from('logs').insert({
          user_id: user?.id,
          action: 'payment_webhook_captured',
          details: { 
            amount: amount, 
            plan: planType, 
            razorpay_id: razorpayId 
          }
        });

        // Insert into payments table
        await supabase.from('payments').insert({
          user_id: user?.id,
          amount: amount,
          plan_type: planType,
          razorpay_id: razorpayId,
          status: 'captured'
        });
      }
      res.json({ status: 'ok' });
    } else {
      res.status(403).json({ status: 'invalid signature' });
    }
  } else {
    res.status(405).end();
  }
}
