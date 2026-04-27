import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  console.log('[Expiry] Starting plan expiry check...')

  try {
    // Fetch all active users with plans
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id, email, name, plan_name,
        total_leads_received, total_leads_promised,
        is_active, payment_status
      `)
      .eq('payment_status', 'active')
      .neq('plan_name', 'none')
      .not('plan_name', 'is', null)
      .gt('total_leads_promised', 0)

    if (error) throw new Error('Users fetch: ' + error.message)

    const results = {
      checked: users?.length || 0,
      expired: [] as string[],
      urgent: [] as string[],
      warning: [] as string[],
      errors: [] as string[]
    }

    for (const user of (users || [])) {
      try {
        const promised = user.total_leads_promised || 0
        const received = user.total_leads_received || 0
        const remaining = promised - received
        const usedPct = promised > 0 ? (received / promised) * 100 : 0

        // 🔴 100% — Plan Khatam
        if (remaining <= 0) {
          // Deactivate user
          await supabase.from('users').update({
            is_active: false,
            is_online: false,
            daily_limit: 0
          }).eq('id', user.id)

          // Send push notification
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: user.id,
              title: '🔴 Plan Khatam Ho Gaya!',
              body: `${user.name || 'Aapka'} plan complete hua. Abhi renew karo aur leads milte rahe!`,
              url: '/pricing'
            }
          })

          results.expired.push(user.email)
          console.log(`[Expiry] 🔴 EXPIRED: ${user.email}`)
        }

        // 🟠 95%+ — Very Urgent
        else if (usedPct >= 95) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: user.id,
              title: '🟠 Sirf ' + remaining + ' Leads Bache!',
              body: `Aapka plan ${Math.round(usedPct)}% use ho gaya. Abhi renew karo!`,
              url: '/pricing'
            }
          })

          results.urgent.push(user.email)
          console.log(`[Expiry] 🟠 URGENT: ${user.email} (${remaining} left)`)
        }

        // 🟡 80%+ — Warning
        else if (usedPct >= 80) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: user.id,
              title: '🟡 Plan 80% Use Ho Gaya',
              body: `${remaining} leads bache hain. Renew karne ka sahi time hai!`,
              url: '/pricing'
            }
          })

          results.warning.push(user.email)
          console.log(`[Expiry] 🟡 WARNING: ${user.email} (${remaining} left)`)
        }

      } catch (err) {
        console.error(`[Expiry] Error for ${user.email}:`, err)
        results.errors.push(user.email)
      }
    }

    console.log('[Expiry] Done:', JSON.stringify(results))

    return new Response(JSON.stringify({
      success: true,
      ...results
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[Expiry] FATAL:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
