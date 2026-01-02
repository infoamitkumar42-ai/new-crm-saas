// api/razorpay-webhook.ts

// No external imports - uses native fetch
// Plan Configuration
const PLANS: Record<string, { daily_limit: number; duration_days: number }> = {
  'new_member': { daily_limit: 2, duration_days: 30 },
  'supervisor': { daily_limit: 4, duration_days: 30 },
  'manager': { daily_limit: 7, duration_days: 30 },
  'boost_a': { daily_limit: 10, duration_days: 7 },
  'boost_b': { daily_limit: 17, duration_days: 7 },
  'boost_c': { daily_limit: 26, duration_days: 7 },
  'starter': { daily_limit: 10, duration_days: 30 },
  'fast_start': { daily_limit: 5, duration_days: 7 },
  'turbo_weekly': { daily_limit: 20, duration_days: 7 },
  'max_blast': { daily_limit: 35, duration_days: 7 },
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Handle GET (Health Check)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      message: 'Razorpay webhook is running',
      timestamp: new Date().toISOString(),
      env_check: {
        supabase_url: !!process.env.VITE_SUPABASE_URL,
        service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
  }

  // Handle POST (Webhook)
  if (req.method === 'POST') {
    console.log('📦 Webhook Received')

    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials')
        return res.status(500).json({ error: 'Server configuration error' })
      }

      // Check payload
      const payload = req.body
      console.log('Event:', payload?.event)

      // Handle payment.captured
      if (payload?.event === 'payment.captured') {
        const payment = payload.payload?.payment?.entity

        if (!payment) {
          return res.status(400).json({ error: 'No payment data' })
        }

        // Extract data
        const userId = payment.notes?.user_id
        const planName = payment.notes?.plan_name || 'new_member'
        const payerEmail = payment.email || payment.notes?.user_email || ''
        const payerPhone = payment.contact || ''
        const amount = payment.amount ? payment.amount / 100 : 0

        console.log('Payment:', { userId, planName, amount })

        // Find user if ID missing
        let finalUserId = userId
        if (!finalUserId && payerEmail) {
          const userResp = await fetch(
            `${supabaseUrl}/rest/v1/users?email=ilike.${encodeURIComponent(payerEmail)}&select=id&limit=1`,
            { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
          )
          const users = await userResp.json()
          if (users?.length > 0) finalUserId = users[0].id
        }

        // Log payment
        await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: 'POST',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            user_id: finalUserId || null,
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            amount: amount,
            plan_name: planName,
            payer_email: payerEmail,
            payer_phone: payerPhone,
            status: finalUserId ? 'captured' : 'user_not_found',
            raw_payload: payment
          })
        })

        // Activate Plan
        if (finalUserId) {
          const plan = PLANS[planName.toLowerCase()] || PLANS['new_member']
          const validUntil = new Date()
          validUntil.setDate(validUntil.getDate() + plan.duration_days)

          const updateResp = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${finalUserId}`, {
            method: 'PATCH',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              plan_name: planName,
              daily_limit: plan.daily_limit,
              payment_status: 'active',
              valid_until: validUntil.toISOString(),
              leads_today: 0,
              updated_at: new Date().toISOString()
            })
          })

          if (updateResp.ok) {
            console.log('🎉 Plan Activated:', planName)
            return res.status(200).json({ success: true, plan: planName })
          }
        }

        return res.status(200).json({ success: false, message: 'User not found' })
      }

      return res.status(200).json({ received: true })

    } catch (error: any) {
      console.error('❌ Error:', error.message)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
