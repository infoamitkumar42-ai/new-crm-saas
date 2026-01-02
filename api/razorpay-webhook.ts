// api/razorpay-webhook.ts

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      message: 'Webhook ready',
      timestamp: new Date().toISOString()
    })
  }

  if (req.method === 'POST') {
    console.log('📦 Webhook received:', req.body?.event)
    
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Server config error' })
      }

      // Handle BOTH authorized AND captured
      if (req.body?.event === 'payment.captured' || req.body?.event === 'payment.authorized') {
        const payment = req.body.payload?.payment?.entity
        
        if (!payment) {
          return res.status(400).json({ error: 'No payment data' })
        }

        // Extract ALL data
        const userId = payment.notes?.user_id
        const planName = payment.notes?.plan_name || 'starter'
        const userEmail = payment.notes?.user_email || payment.email || ''
        const amount = payment.amount / 100 // Convert paise to rupees
        
        console.log('💳 Processing:', { userId, planName, amount, userEmail })

        // 1️⃣ ALWAYS save payment record (regardless of plan/amount)
        const paymentRecord = {
          user_id: userId || null,
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          amount: amount,
          plan_name: planName,
          payer_email: userEmail,
          payer_phone: payment.contact || '',
          status: 'captured',
          raw_payload: payment
        }

        await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: 'POST',
          headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(paymentRecord)
        })

        console.log('💾 Payment saved')

        // 2️⃣ Find user (by ID or email)
        let finalUserId = userId
        
        if (!finalUserId && userEmail) {
          // Try finding by email
          const userResp = await fetch(
            `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(userEmail)}&select=id&limit=1`,
            { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
          )
          const users = await userResp.json()
          if (users?.[0]) {
            finalUserId = users[0].id
            console.log('📧 User found by email:', userEmail)
          }
        }

        // 3️⃣ Activate plan if user found
        if (finalUserId) {
          // Fetch plan details from database (NOT from payment amount)
          const planResp = await fetch(
            `${supabaseUrl}/rest/v1/plan_config?plan_name=eq.${planName}&select=*&limit=1`,
            { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
          )
          const plans = await planResp.json()
          const planConfig = plans?.[0]

          if (planConfig) {
            // Calculate validity
            const validDays = planConfig.duration_days || planConfig.validity_days || 30
            const validUntil = new Date()
            validUntil.setDate(validUntil.getDate() + validDays)

            // Update user with plan details
            const updateData = {
              plan_name: planName,
              daily_limit: planConfig.daily_limit || 0,
              payment_status: 'active',
              valid_until: validUntil.toISOString(),
              leads_today: 0,
              updated_at: new Date().toISOString()
            }

            const updateResp = await fetch(
              `${supabaseUrl}/rest/v1/users?id=eq.${finalUserId}`,
              {
                method: 'PATCH',
                headers: { 
                  'apikey': supabaseKey, 
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify(updateData)
              }
            )

            console.log('✅ Plan activated:', planName, 'for user:', finalUserId)
            return res.status(200).json({ 
              success: true, 
              message: 'Plan activated',
              plan: planName,
              user: finalUserId
            })
          } else {
            console.log('⚠️ Plan config not found for:', planName)
          }
        } else {
          console.log('⚠️ User not found')
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Payment recorded',
          payment_id: payment.id
        })
      }

      return res.status(200).json({ received: true })

    } catch (error: any) {
      console.error('❌ Webhook error:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).end()
}
