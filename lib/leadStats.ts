import { supabase } from '../supabaseClient';

/**
 * ACCURATE LEAD STATS UTILITY
 * Single source of truth for all lead counts
 * Always uses real-time database counts (no cached values)
 */

// Get today's date range in ISO format
export function getTodayRange() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    return { todayStart, tomorrowStart };
}

// Get accurate stats for a single user
export async function getUserLeadStats(userId: string) {
    const { todayStart, tomorrowStart } = getTodayRange();

    // Total leads (all time)
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // Today's leads
    const { count: todayLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart);

    // Interested leads
    const { count: interestedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'Interested');

    // Closed leads
    const { count: closedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'Closed');

    return {
        total: totalLeads || 0,
        today: todayLeads || 0,
        interested: interestedLeads || 0,
        closed: closedLeads || 0
    };
}

// Get stats for multiple users in parallel (fast!)
export async function getBulkUserStats(userIds: string[]) {
    const statsPromises = userIds.map(async (userId) => {
        const stats = await getUserLeadStats(userId);
        return { userId, ...stats };
    });

    const results = await Promise.all(statsPromises);

    // Convert to map for easy lookup
    const statsMap: { [key: string]: { total: number; today: number; interested: number; closed: number } } = {};
    results.forEach(r => {
        statsMap[r.userId] = { total: r.total, today: r.today, interested: r.interested, closed: r.closed };
    });

    return statsMap;
}

// Get team stats (for manager dashboard)
export async function getTeamStats(managerId: string) {
    // Get all team members
    const { data: members } = await supabase
        .from('users')
        .select('id, name, email, plan_name, daily_limit, is_active, payment_status')
        .eq('manager_id', managerId);

    if (!members || members.length === 0) {
        return {
            teamSize: 0,
            activeMembers: 0,
            totalLeads: 0,
            interestedLeads: 0,
            closedLeads: 0,
            members: []
        };
    }

    const memberIds = members.map(m => m.id);
    const statsMap = await getBulkUserStats(memberIds);

    // Calculate totals
    let totalLeads = 0;
    let interestedLeads = 0;
    let closedLeads = 0;

    const membersWithStats = members.map(member => {
        const stats = statsMap[member.id] || { total: 0, today: 0, interested: 0, closed: 0 };
        totalLeads += stats.total;
        interestedLeads += stats.interested;
        closedLeads += stats.closed;

        return {
            ...member,
            total_leads: stats.total,
            today_leads: stats.today,
            interested_leads: stats.interested,
            closed_leads: stats.closed
        };
    });

    return {
        teamSize: members.length,
        activeMembers: members.filter(m => m.payment_status === 'active').length,
        totalLeads,
        interestedLeads,
        closedLeads,
        members: membersWithStats
    };
}

// Get admin overview stats
export async function getAdminOverviewStats() {
    // Total users
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member');

    // Active users
    const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('is_active', true)
        .eq('payment_status', 'active');

    // Total leads
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    // Today's leads
    const { todayStart, tomorrowStart } = getTodayRange();
    const { count: todayLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart);

    // Interested leads
    const { count: interestedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Interested');

    // Closed leads
    const { count: closedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Closed');

    return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalLeads: totalLeads || 0,
        todayLeads: todayLeads || 0,
        interestedLeads: interestedLeads || 0,
        closedLeads: closedLeads || 0
    };
}

// Sync leads_today counter with actual count (call this in cron or after lead assignment)
export async function syncLeadsTodayCounter(userId: string) {
    const { todayStart, tomorrowStart } = getTodayRange();

    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart);

    await supabase
        .from('users')
        .update({ leads_today: count || 0 })
        .eq('id', userId);

    return count || 0;
}

// Reset all users' leads_today to 0 (call at midnight)
export async function resetAllDailyCounters() {
    await supabase
        .from('users')
        .update({ leads_today: 0 })
        .neq('id', '');

    console.log('All daily counters reset');
}
