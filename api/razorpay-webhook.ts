// api/razorpay-webhook.ts

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
        const planName = payment.notes?.plan_name || 'starter'
        const payerEmail = payment.email || payment.notes?.user_email || ''
        const payerPhone = payment.contact || ''
        const amount = payment.amount ? payment.amount / 100 : 0

        console.log('💳 Payment:', { userId, planName, amount })

        // ✅ NEW: Fetch Plan from Database (Dynamic)
        const planResp = await fetch(
          `${supabaseUrl}/rest/v1/plan_config?plan_name=eq.${planName.toLowerCase()}&select=*&limit=1`,
          { 
            headers: { 
              'apikey': supabaseKey, 
              'Authorization': `Bearer ${supabaseKey}` 
            } 
          }
        )
        const plans = await planResp.json()
        
        let planConfig
        if (plans?.length > 0) {
          planConfig = plans[0]
          console.log('✅ Plan found in DB:', planConfig.display_name)
        } else {
          console.warn('⚠️ Plan not found, using default')
          // Fallback to starter if plan not found
          const fallbackResp = await fetch(
            `${supabaseUrl}/rest/v1/plan_config?plan_name=eq.starter&select=*&limit=1`,
            { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
          )
          const fallbackPlans = await fallbackResp.json()
          planConfig = fallbackPlans[0]
        }

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

        // Log payment (Save record first)
        const paymentInsert = await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: 'POST',
          headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`, 
            'Content-Type': 'application/json', 
            'Prefer': 'return=minimal' 
          },
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

        console.log('💾 Payment logged:', paymentInsert.ok ? 'Success' : 'Failed')

        // ✅ Activate Plan with DB values
        if (finalUserId && planConfig) {
          const validUntil = new Date()
          validUntil.setDate(validUntil.getDate() + planConfig.duration_days)

          const updateResp = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${finalUserId}`, {
            method: 'PATCH',
            headers: { 
              'apikey': supabaseKey, 
              'Authorization': `Bearer ${supabaseKey}`, 
              'Content-Type': 'application/json', 
              'Prefer': 'return=minimal' 
            },
            body: JSON.stringify({
              plan_name: planName,
              daily_limit: planConfig.daily_limit,
              hourly_limit: planConfig.hourly_limit,
              payment_status: 'active',
              valid_until: validUntil.toISOString(),
              leads_today: 0,
              updated_at: new Date().toISOString()
            })
          })

          if (updateResp.ok) {
            console.log('🎉 Plan Activated:', {
              plan: planConfig.display_name,
              daily_limit: planConfig.daily_limit,
              valid_until: validUntil.toISOString()
            })
            return res.status(200).json({ 
              success: true, 
              plan: planConfig.display_name,
              user_id: finalUserId,
              valid_until: validUntil.toISOString()
            })
          } else {
            console.error('❌ User update failed')
            return res.status(500).json({ error: 'Failed to activate plan' })
          }
        }

        return res.status(200).json({ 
          success: false, 
          message: finalUserId ? 'Plan config missing' : 'User not found' 
        })
      }

      // Other webhook events
      return res.status(200).json({ received: true, event: payload?.event })

    } catch (error: any) {
      console.error('❌ Webhook Error:', error.message)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
