// api/razorpay-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Handle GET (health check)
  if (req.method === 'GET') {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

    return res.status(200).json({
      status: 'active',
      message: 'Razorpay webhook is running',
      timestamp: new Date().toISOString(),
      env: {
        supabase_url: supabaseUrl ? 'SET' : 'MISSING',
        service_key: serviceKey ? 'SET' : 'MISSING',
        webhook_secret: webhookSecret ? 'SET' : 'MISSING'
      },
      plans: Object.keys(PLANS)
    })
  }

  // Handle POST (webhook)
  if (req.method === 'POST') {
    console.log('========================================')
    console.log('📦 RAZORPAY WEBHOOK RECEIVED')
    console.log('========================================')

    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      console.log('🔑 Env Check:')
      console.log('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
      console.log('   SERVICE_KEY:', supabaseKey ? '✅' : '❌')

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing environment variables')
        return res.status(500).json({ error: 'Server configuration error' })
      }

      const payload = req.body
      console.log('📋 Event:', payload?.event)

      // Handle payment.captured
      if (payload?.event === 'payment.captured') {
        const payment = payload.payload?.payment?.entity

        if (!payment) {
          return res.status(400).json({ error: 'No payment data' })
        }

        const userId = payment.notes?.user_id
        const planName = payment.notes?.plan_name || payment.notes?.plan || 'new_member'
        const payerEmail = payment.email || ''
        const payerPhone = payment.contact || ''
        const amount = payment.amount ? payment.amount / 100 : 0

        console.log('💳 Payment Details:')
        console.log('   ID:', payment.id)
        console.log('   Amount: ₹' + amount)
        console.log('   User ID:', userId || 'NOT PROVIDED')
        console.log('   Plan:', planName)
        console.log('   Email:', payerEmail)

        // Find user by email if no user_id
        let finalUserId = userId
        if (!finalUserId && payerEmail) {
          console.log('🔍 Finding user by email...')
          finalUserId = await findUserByEmail(supabaseUrl, supabaseKey, payerEmail)
        }

        // Log payment
        await logPayment(supabaseUrl, supabaseKey, {
          user_id: finalUserId,
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          amount: amount,
          plan_name: planName,
          payer_email: payerEmail,
          payer_phone: payerPhone,
          status: finalUserId ? 'captured' : 'user_not_found',
          raw_payload: payment
        })

        // Activate plan if user found
        if (finalUserId) {
          const plan = PLANS[planName.toLowerCase()] || PLANS['new_member']
          const validUntil = new Date()
          validUntil.setDate(validUntil.getDate() + plan.duration_days)

          const success = await updateUserPlan(supabaseUrl, supabaseKey, finalUserId, {
            plan_name: planName,
            daily_limit: plan.daily_limit,
            payment_status: 'active',
            valid_until: validUntil.toISOString(),
            leads_today: 0
          })

          if (success) {
            console.log('🎉 Plan activated:', planName)
            return res.status(200).json({ success: true, plan: planName })
          }
        }

        return res.status(200).json({ 
          success: false, 
          message: finalUserId ? 'Activation failed' : 'User not found' 
        })
      }

      // Handle payment.failed
      if (payload?.event === 'payment.failed') {
        const payment = payload.payload?.payment?.entity
        console.log('❌ Payment failed:', payment?.id)

        if (payment) {
          await logPayment(supabaseUrl, supabaseKey, {
            user_id: payment.notes?.user_id,
            razorpay_payment_id: payment.id,
            amount: payment.amount ? payment.amount / 100 : 0,
            plan_name: payment.notes?.plan_name,
            payer_email: payment.email,
            status: 'failed',
            raw_payload: payment
          })
        }

        return res.status(200).json({ received: true, status: 'failed' })
      }

      // Other events
      return res.status(200).json({ received: true })

    } catch (error: any) {
      console.error('❌ Error:', error.message)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// Helper: Find user by email
async function findUserByEmail(
  supabaseUrl: string,
  supabaseKey: string,
  email: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?email=ilike.${encodeURIComponent(email)}&select=id&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    )

    if (response.ok) {
      const users = await response.json()
      if (users?.length > 0) {
        console.log('✅ User found:', users[0].id)
        return users[0].id
      }
    }
    return null
  } catch (error) {
    console.error('Find user error:', error)
    return null
  }
}

// Helper: Update user plan
async function updateUserPlan(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  data: any
): Promise<boolean> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          ...data,
          updated_at: new Date().toISOString()
        })
      }
    )
    return response.ok
  } catch (error) {
    console.error('Update error:', error)
    return false
  }
}

// Helper: Log payment
async function logPayment(
  supabaseUrl: string,
  supabaseKey: string,
  data: any
): Promise<boolean> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/payments`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          ...data,
          created_at: new Date().toISOString()
        })
      }
    )
    return response.ok
  } catch (error) {
    console.error('Log payment error:', error)
    return false
  }
}
