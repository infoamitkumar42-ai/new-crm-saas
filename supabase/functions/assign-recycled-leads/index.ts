import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const startTime = Date.now()
  const batchLabel = req.headers.get('x-batch') || 'manual'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  console.log(`[Recycler] Starting ${batchLabel} batch...`)

  try {
    // Get active online users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id, email, plan_name, team_code,
        recycled_leads_quota, recycled_leads_received,
        leads_today, daily_limit, daily_limit_override,
        total_leads_received, total_leads_promised
      `)
      .eq('is_active', true)
      .eq('is_online', true)
      .eq('payment_status', 'active')
      .not('plan_name', 'eq', 'none')
      .not('plan_name', 'is', null)

    if (usersError) throw new Error('Users fetch: ' + usersError.message)

    console.log(`[Recycler] ${users?.length || 0} active users`)

    // Get plan config
    const { data: configRow } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'plan_fresh_config')
      .single()

    const planConfigs = configRow?.config_value || {}

    const results = []
    let totalAssigned = 0

    for (const user of (users || [])) {
      try {
        const config = planConfigs[user.plan_name]
        if (!config) continue

        const recycledRemaining =
          (user.recycled_leads_quota || 0) -
          (user.recycled_leads_received || 0)

        if (recycledRemaining <= 0) continue

        const totalRemaining =
          (user.total_leads_promised || 0) -
          (user.total_leads_received || 0)

        if (totalRemaining <= 0) continue

        const dailyLimit =
          user.daily_limit_override || user.daily_limit || 0
        const leadsToday = user.leads_today || 0

        if (leadsToday >= dailyLimit) continue

        // Half of daily recycled per batch
        const batchTarget = Math.ceil((config.recycled_daily || 0) / 2)

        const canAssign = Math.min(
          batchTarget,
          recycledRemaining,
          totalRemaining,
          dailyLimit - leadsToday
        )

        if (canAssign <= 0) continue

        const { data: assigned, error: rpcError } = await supabase
          .rpc('assign_recycled_leads', {
            p_user_id: user.id,
            p_count: canAssign
          })

        if (rpcError) {
          console.error(`[Recycler] ${user.email}:`, rpcError.message)
          continue
        }

        const count = assigned || 0

        if (count > 0) {
          totalAssigned += count
          results.push({ user: user.email, plan: user.plan_name, assigned: count })

          // Push notification
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: user.id,
                title: '🔔 Naya Lead Aaya!',
                body: `${count} naye lead${count > 1 ? 's' : ''} assign hue hain!`,
                url: '/dashboard'
              }
            })
          } catch (_) { /* non-critical */ }
        }

      } catch (err) {
        console.error(`[Recycler] Error for ${user.email}:`, err)
      }
    }

    const response = {
      success: true,
      batch: batchLabel,
      users_processed: users?.length || 0,
      leads_assigned: totalAssigned,
      duration_ms: Date.now() - startTime,
      details: results
    }

    console.log('[Recycler] Done:', JSON.stringify(response))
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[Recycler] FATAL:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
