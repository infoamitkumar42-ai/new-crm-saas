import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Admin Client (uses Service Role Key)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Plan Configuration - Match with your existing plan names
const PLANS: Record<string, { daily_limit: number; duration_days: number; type: string }> = {
  // Monthly Plans
  'new_member': { daily_limit: 2, duration_days: 30, type: 'monthly' },
  'supervisor': { daily_limit: 4, duration_days: 30, type: 'monthly' },
  'manager': { daily_limit: 7, duration_days: 30, type: 'monthly' },
  
  // Boost Packs (7-Day)
  'boost_a': { daily_limit: 10, duration_days: 7, type: 'boost' },
  'boost_b': { daily_limit: 17, duration_days: 7, type: 'boost' },
  'boost_c': { daily_limit: 26, duration_days: 7, type: 'boost' },
  
  // Alternative names (from PRD)
  'starter': { daily_limit: 10, duration_days: 30, type: 'monthly' },
  'fast_start': { daily_limit: 5, duration_days: 7, type: 'boost' },
  'turbo_weekly': { daily_limit: 20, duration_days: 7, type: 'boost' },
  'max_blast': { daily_limit: 35, duration_days: 7, type: 'boost' },
  
  // Legacy support
  'starter_monthly': { daily_limit: 2, duration_days: 30, type: 'monthly' },
  'growth_monthly': { daily_limit: 4, duration_days: 30, type: 'monthly' },
}

// Get plan details
function getPlanDetails(planName: string) {
  const plan = PLANS[planName?.toLowerCase()]
  if (plan) return plan
  
  // Default fallback
  console.log('⚠️ Unknown plan, using default:', planName)
  return { daily_limit: 2, duration_days: 30, type: 'monthly' }
}

export async function POST(req: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📦 Razorpay Webhook Received')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    const body = await req.text()
    const payload = JSON.parse(body)
    
    console.log('Event:', payload.event)

    // Handle payment.captured event
    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity

      // Extract data from payment notes
      const userId = payment.notes?.user_id
      const planName = payment.notes?.plan_name || payment.notes?.plan
      const userEmail = payment.notes?.user_email || payment.email
      const userName = payment.notes?.user_name || ''

      console.log('💳 Payment Details:')
      console.log('   Payment ID:', payment.id)
      console.log('   Amount:', payment.amount / 100, 'INR')
      console.log('   User ID:', userId)
      console.log('   Plan:', planName)
      console.log('   Email:', userEmail)

      // Check if we have user_id
      if (!userId) {
        console.error('❌ Missing user_id in payment notes!')
        
        // Try to find user by email
        let foundUser = null
        if (payment.email) {
          const { data } = await supabase
            .from('users')
            .select('id, email')
            .ilike('email', payment.email)
            .single()
          foundUser = data
        }

        // Log payment for manual processing
        await supabase.from('payments').insert({
          user_id: foundUser?.id || null,
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          amount: payment.amount / 100,
          currency: payment.currency,
          plan_name: planName || 'unknown',
          payer_email: payment.email,
          payer_phone: payment.contact,
          status: foundUser ? 'pending_activation' : 'user_not_found',
          raw_payload: payment
        })

        if (foundUser) {
          console.log('✅ Found user by email:', foundUser.email)
          // Continue with activation using found user
          return await activatePlan(foundUser.id, planName, payment)
        }

        return NextResponse.json({ 
          success: false, 
          message: 'User not found. Payment logged for manual processing.',
          paymentId: payment.id
        })
      }

      // Activate plan
      return await activatePlan(userId, planName, payment)
    }

    // Handle payment.failed event
    if (payload.event === 'payment.failed') {
      const payment = payload.payload.payment.entity
      console.log('❌ Payment failed:', payment.id)
      console.log('   Error:', payment.error_description)

      await supabase.from('payments').insert({
        user_id: payment.notes?.user_id,
        razorpay_payment_id: payment.id,
        amount: payment.amount / 100,
        plan_name: payment.notes?.plan_name,
        payer_email: payment.email,
        status: 'failed',
        raw_payload: payment
      })

      return NextResponse.json({ received: true, status: 'failed' })
    }

    // Other events
    console.log('ℹ️ Unhandled event:', payload.event)
    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Webhook Error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Activate user's plan
async function activatePlan(userId: string, planName: string, payment: any) {
  console.log('🔄 Activating plan for user:', userId)

  const plan = getPlanDetails(planName)
  
  // Calculate expiry date
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + plan.duration_days)

  // Update user's plan
  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan_name: planName,
      daily_limit: plan.daily_limit,
      payment_status: 'active',
      valid_until: validUntil.toISOString(),
      leads_today: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (updateError) {
    console.error('❌ Failed to update user:', updateError)
    
    // Still log the payment
    await supabase.from('payments').insert({
      user_id: userId,
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      amount: payment.amount / 100,
      plan_name: planName,
      payer_email: payment.email,
      status: 'activation_failed',
      raw_payload: payment
    })

    throw updateError
  }

  // Log successful payment
  await supabase.from('payments').insert({
    user_id: userId,
    razorpay_payment_id: payment.id,
    razorpay_order_id: payment.order_id,
    amount: payment.amount / 100,
    currency: payment.currency,
    plan_name: planName,
    payer_email: payment.email,
    payer_phone: payment.contact,
    status: 'captured',
    raw_payload: payment
  })

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 PLAN ACTIVATED SUCCESSFULLY!')
  console.log('   User ID:', userId)
  console.log('   Plan:', planName)
  console.log('   Daily Limit:', plan.daily_limit)
  console.log('   Valid Until:', validUntil.toISOString())
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return NextResponse.json({
    success: true,
    message: 'Plan activated successfully',
    data: {
      userId,
      planName,
      dailyLimit: plan.daily_limit,
      validUntil: validUntil.toISOString()
    }
  })
}

// GET request - for testing webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Razorpay webhook endpoint is running',
    timestamp: new Date().toISOString(),
    plans: Object.keys(PLANS)
  })
}
