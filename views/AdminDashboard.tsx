/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - AdminDashboard.tsx v2.0                       ║
 * ║  Status: STABLE - UPDATED PLAN OPTIONS                     ║
 * ║  Features:                                                 ║
 * ║  - ✅ Includes All New Plans (Weekly/Turbo Boost)          ║
 * ║  - ✅ Fixes Plan Activation Modal                          ║
 * ║  - ✅ Corrects Plan Weight & Limits                        ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  Users, DollarSign, RefreshCw, Upload, Trash2,
  Search, CheckCircle, LogOut, Download,
  AlertTriangle, UserCheck, UserX, ChevronDown, X,
  Activity, BarChart3, Clock, Zap, Target, PieChart,
  Globe, Wifi, WifiOff, Timer, Edit3
} from 'lucide-react';
import UserQuickEdit from '../components/UserQuickEdit';

// ============================================================
// Types & Interfaces
// ============================================================

interface SystemStats {
  totalUsers: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  onlineNow: number;
  loginsToday: number;
  leadsDistributedToday: number;
  leadsDistributedWeek: number;
  leadsDistributedMonth: number;
  avgSessionDuration: string;
  starterUsers: number;
  supervisorUsers: number;
  managerUsers: number;
  boosterUsers: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  mrr: number;
  churnRate: number;
  queuedLeads: number;
  failedDistributions: number;
  orphanLeads: number;
  systemUptime: number;
}

interface HourlyActivity {
  hour: number;
  logins: number;
  leads: number;
  activeUsers: number;
}

interface PlanAnalytics {
  planName: string;
  userCount: number;
  revenue: number;
  avgLeadsPerUser: number;
  churnRate: number;
  satisfaction: number;
}

interface UserActivity {
  userId: string;
  name: string;
  email: string;
  plan: string;
  lastActive: string;
  isOnline: boolean;
  loginCount: number;
  leadsReceived: number;
  dailyLimit: number;
  dailyLimitOverride: number | null;
  conversionRate: number;
  sessionTime: number;
}

type Role = 'admin' | 'manager' | 'member';
type TimeRange = 'today' | 'week' | 'month';

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  payment_status: 'active' | 'inactive' | 'pending';
  plan_name: string | null;
  daily_limit: number | null;
  daily_limit_override: number | null;
  leads_today: number | null;
  valid_until: string | null;
  manager_id: string | null;
  team_code: string | null;
  created_at: string;
  is_online: boolean; // Added for live tracking
  total_leads_promised?: number; // Optional context
}

interface OrphanLeadRow {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  miss_reason: string | null;
  status: string;
  created_at: string;
}

// Smart Activation Types
interface ActivationUser {
  id: string;
  email: string;
  name: string;
  plan_name: string | null;
  payment_status: string;
  total_leads_promised: number;
  total_leads_received: number;
  fresh_leads_quota: number;
  fresh_leads_received: number;
  recycled_leads_quota: number;
  recycled_leads_received: number;
  daily_limit: number;
  leads_today: number;
  is_new_system: boolean;
  plan_start_date: string | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  plan_name: string;
  razorpay_payment_id: string;
  created_at: string;
}

interface MissedPayment {
  payment_id: string;
  razorpay_payment_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  plan_name: string;
  payment_date: string;
  user_status: string;
  user_plan: string;
}

// Full plan config (mirrors razorpay-webhook.ts)
const FULL_PLAN_CONFIG: Record<string, {
  price: number; dailyLeads: number; totalLeads: number;
  freshCount: number; recycledCount: number; weight: number;
}> = {
  starter:      { price: 999,  dailyLeads: 5,  totalLeads: 55,  freshCount: 21, recycledCount: 34, weight: 1 },
  supervisor:   { price: 1999, dailyLeads: 7,  totalLeads: 115, freshCount: 42, recycledCount: 73, weight: 3 },
  manager:      { price: 3499, dailyLeads: 8,  totalLeads: 150, freshCount: 76, recycledCount: 74, weight: 5 },
  weekly_boost: { price: 1999, dailyLeads: 12, totalLeads: 92,  freshCount: 43, recycledCount: 49, weight: 7 },
  turbo_boost:  { price: 2499, dailyLeads: 14, totalLeads: 108, freshCount: 54, recycledCount: 54, weight: 9 },
};

// API Response Types
interface DashboardAPIResponse {
  user_stats: {
    total_users: number;
    active_users: number;
    daily_active_users: number;
    monthly_active_users: number;
    online_now: number;
    logins_today: number;
    starter_users: number;
    supervisor_users: number;
    manager_users: number;
    booster_users: number;
    mrr: number;
    daily_revenue: number;
  };
  leads_stats: {
    leads_today: number;
    leads_this_week: number;
    leads_this_month: number;
    total_leads: number;
  };
  queue_stats: {
    queued_leads: number;
    orphan_leads: number;
    failed_distributions: number;
  };
  hourly_leads: Array<{ hour: number; lead_count: number }>;
  hourly_logins: Array<{ hour: number; login_count: number }>;
  hourly_active: Array<{ hour: number; active_count: number }>;
  plan_analytics: Array<{
    plan_name: string;
    user_count: number;
    revenue: number;
    avg_leads_per_user: number;
    churn_rate: number;
    satisfaction: number;
  }>;
  user_activities: Array<{
    user_id: string;
    name: string;
    email: string;
    plan: string;
    last_active: string;
    is_online: boolean;
    login_count: number;
    leads_received: number;
    daily_limit?: number;
    daily_limit_override?: number | null;
    conversion_rate: number;
    session_time: number;
  }>;
  fetched_at: string;
}

type ColorType = 'blue' | 'green' | 'emerald' | 'purple' | 'orange' | 'red';

// ============================================================
// Component
// ============================================================

export const AdminDashboard: React.FC = () => {
  // State
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    dailyActiveUsers: 0,
    monthlyActiveUsers: 0,
    onlineNow: 0,
    loginsToday: 0,
    leadsDistributedToday: 0,
    leadsDistributedWeek: 0,
    leadsDistributedMonth: 0,
    avgSessionDuration: '0m',
    starterUsers: 0,
    supervisorUsers: 0,
    managerUsers: 0,
    boosterUsers: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0,
    mrr: 0,
    churnRate: 4.2,
    queuedLeads: 0,
    failedDistributions: 0,
    orphanLeads: 0,
    systemUptime: 99.9
  });

  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
  const [planAnalytics, setPlanAnalytics] = useState<PlanAnalytics[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showOrphansModal, setShowOrphansModal] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [orphanLeads, setOrphanLeads] = useState<OrphanLeadRow[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showPlanModal, setShowPlanModal] = useState<AdminUserRow | null>(null);
  const [showEditModal, setShowEditModal] = useState<AdminUserRow | null>(null);

  // Upload
  const [showUpload, setShowUpload] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  // Manual Assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState('');
  const [assignStrategy, setAssignStrategy] = useState<'smart_fair' | 'fill_quota'>('smart_fair');
  const [assignLogs, setAssignLogs] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Smart Activation State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationUser, setActivationUser] = useState<ActivationUser | null>(null);
  const [activationPlan, setActivationPlan] = useState('');
  const [activationMode, setActivationMode] = useState<'renewal' | 'fresh'>('renewal');
  const [activationPaymentId, setActivationPaymentId] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [missedPayments, setMissedPayments] = useState<MissedPayment[]>([]);
  const [showMissedPayments, setShowMissedPayments] = useState(false);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🔥 UPDATED PLAN OPTIONS (Matches Subscription.tsx)
  const planOptions = [
    { id: 'none', name: 'No Plan', daily_limit: 0, days: 0, plan_weight: 0 },
    { id: 'starter', name: 'Starter', daily_limit: 5, days: 10, plan_weight: 1 },
    { id: 'supervisor', name: 'Supervisor', daily_limit: 7, days: 15, plan_weight: 3 },
    { id: 'manager', name: 'Manager', daily_limit: 8, days: 20, plan_weight: 5 },
    { id: 'weekly_boost', name: 'Weekly Boost', daily_limit: 12, days: 7, plan_weight: 7 },
    { id: 'turbo_boost', name: 'Turbo Boost', daily_limit: 14, days: 7, plan_weight: 9 },
  ] as const;

  // ============================================================
  // OPTIMIZED: Single RPC Call for ALL Analytics Data
  // ============================================================

  const fetchAnalytics = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setRefreshing(true);
      setError(null);

      // ✅ SINGLE RPC CALL - All data in ONE query!
      const { data, error: rpcError } = await supabase.rpc('get_admin_dashboard_data');

      // 🔥 FIX: Also fetch REAL payments and online count (RPC may be outdated)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [paymentsResult, onlineResult, orphanResult] = await Promise.all([
        supabase.from('payments').select('amount').eq('status', 'captured').gte('created_at', today.toISOString()),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_online', true).eq('is_active', true),
        supabase.from('leads').select('id', { count: 'exact', head: true }).or('status.eq.New,status.eq.Fresh').is('user_id', null)
      ]);

      const realDailyRevenue = (paymentsResult.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const realOnlineCount = onlineResult.count || 0;
      const realOrphanCount = orphanResult.count || 0;

      if (rpcError) {
        // Check if it's an access denied error
        if (rpcError.message.includes('Access denied')) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(rpcError.message);
      }

      if (!data) {
        throw new Error('No data received from server');
      }

      const response = data as DashboardAPIResponse;

      // Build hourly maps
      const leadsMap = new Map<number, number>();
      const loginsMap = new Map<number, number>();
      const activeMap = new Map<number, number>();

      (response.hourly_leads || []).forEach(h => {
        leadsMap.set(h.hour, h.lead_count);
      });

      (response.hourly_logins || []).forEach(h => {
        loginsMap.set(h.hour, h.login_count);
      });

      (response.hourly_active || []).forEach(h => {
        activeMap.set(h.hour, h.active_count);
      });

      // Generate 24-hour data
      const hourlyData: HourlyActivity[] = [];
      for (let hour = 0; hour < 24; hour++) {
        hourlyData.push({
          hour,
          leads: leadsMap.get(hour) || 0,
          logins: loginsMap.get(hour) || 0,
          activeUsers: activeMap.get(hour) || 0
        });
      }

      // Transform plan analytics
      const plans: PlanAnalytics[] = (response.plan_analytics || []).map(p => ({
        planName: p.plan_name || 'Unknown',
        userCount: p.user_count || 0,
        revenue: p.revenue || 0,
        avgLeadsPerUser: p.avg_leads_per_user || 0,
        churnRate: p.churn_rate || 0,
        satisfaction: p.satisfaction || 0
      }));

      // 🟢 FIX: Fetch limits and leads_today separately because RPC might be outdated
      const { data: userLimits } = await supabase
        .from('users')
        .select('id, daily_limit, daily_limit_override, leads_today')
        .in('id', (response.user_activities || []).map((u: any) => u.user_id));

      const limitMap = new Map();
      (userLimits || []).forEach(u => {
        limitMap.set(u.id, {
          limit: u.daily_limit,
          override: u.daily_limit_override,
          leadsToday: u.leads_today
        });
      });

      // Transform user activities
      const activities: UserActivity[] = (response.user_activities || []).map(u => {
        const userData = limitMap.get(u.user_id);
        return {
          userId: u.user_id,
          name: u.name || 'Unknown',
          email: u.email || '',
          plan: u.plan || 'none',
          lastActive: u.last_active || '',
          isOnline: u.is_online || false,
          loginCount: u.login_count || 0,
          leadsReceived: userData?.leadsToday ?? u.leads_today ?? 0, // 🔥 Use reconciled today's leads
          dailyLimit: userData?.limit || u.daily_limit || 0,
          dailyLimitOverride: userData?.override || u.daily_limit_override || null,
          conversionRate: u.conversion_rate || 0,
          sessionTime: u.session_time || 0
        };
      });

      // Calculate average session duration
      const totalSessionTime = activities.reduce((sum, a) => sum + a.sessionTime, 0);
      const avgSession = activities.length > 0 ? Math.round(totalSessionTime / activities.length) : 0;

      // Set all stats
      const userStats = response.user_stats;
      const leadsStats = response.leads_stats;
      const queueStats = response.queue_stats;

      setStats({
        totalUsers: userStats?.total_users || 0,
        dailyActiveUsers: userStats?.daily_active_users || 0,
        monthlyActiveUsers: userStats?.monthly_active_users || 0,
        onlineNow: realOnlineCount, // 🔥 FIX: Use real is_online count
        loginsToday: userStats?.logins_today || 0,
        leadsDistributedToday: leadsStats?.leads_today || 0,
        leadsDistributedWeek: leadsStats?.leads_this_week || 0,
        leadsDistributedMonth: leadsStats?.leads_this_month || 0,
        avgSessionDuration: `${avgSession}m`,
        starterUsers: userStats?.starter_users || 0,
        supervisorUsers: userStats?.supervisor_users || 0,
        managerUsers: userStats?.manager_users || 0,
        boosterUsers: userStats?.booster_users || 0,
        dailyRevenue: realDailyRevenue, // 🔥 FIX: Use real payments sum
        monthlyRevenue: userStats?.mrr || 0,
        mrr: userStats?.mrr || 0,
        churnRate: 4.2,
        queuedLeads: queueStats?.queued_leads || 0,
        failedDistributions: queueStats?.failed_distributions || 0,
        orphanLeads: realOrphanCount, // 🔥 FIX: Use real unassigned leads count
        systemUptime: 99.9
      });

      setHourlyActivity(hourlyData);
      setPlanAnalytics(plans);
      setUserActivities(activities);

    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Analytics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ============================================================
  // Operations Data Fetch
  // ============================================================

  const fetchOpsData = useCallback(async () => {
    try {
      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      setAdminUsers((allUsers || []) as AdminUserRow[]);

      const { data: orphans } = await supabase
        .from('orphan_leads')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setOrphanLeads((orphans || []) as OrphanLeadRow[]);
    } catch (e) {
      console.error('Ops fetch error:', e);
    }
  }, []);

  // ============================================================
  // User Actions
  // ============================================================

  const toggleUserStatus = useCallback(async (user: AdminUserRow) => {
    const newStatus = user.payment_status === 'active' ? 'inactive' : 'active';
    setActionLoading(user.id);

    try {
      const payload: Partial<AdminUserRow> = { payment_status: newStatus };
      if (newStatus === 'inactive') payload.daily_limit = 0;

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      await fetchOpsData();
      await fetchAnalytics();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  }, [fetchOpsData, fetchAnalytics]);

  const activatePlan = useCallback(async (user: AdminUserRow, planId: string) => {
    const plan = planOptions.find(p => p.id === planId);
    if (!plan) return;

    setActionLoading(user.id);

    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + plan.days);

      const payload = {
        plan_name: plan.id,
        payment_status: plan.id === 'none' ? 'inactive' : 'active',
        daily_limit: plan.daily_limit,
        daily_limit_override: plan.id === 'none' ? null : plan.daily_limit,
        valid_until: plan.id === 'none' ? null : validUntil.toISOString(),
        leads_today: 0,
        plan_weight: plan.plan_weight,
        plan_start_date: new Date().toISOString() // Ensure start date is set
      };

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      setShowPlanModal(null);
      await fetchOpsData();
      await fetchAnalytics();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  }, [fetchOpsData, fetchAnalytics]);

  const deleteUser = useCallback(async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;

      await fetchOpsData();
      await fetchAnalytics();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  }, [fetchOpsData, fetchAnalytics]);

  // ── OPEN ACTIVATION MODAL ──
  const openActivationModal = useCallback(async (userId: string) => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, name, plan_name, payment_status, total_leads_promised, total_leads_received, fresh_leads_quota, fresh_leads_received, recycled_leads_quota, recycled_leads_received, daily_limit, leads_today, is_new_system, plan_start_date')
        .eq('id', userId)
        .single();

      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, plan_name, razorpay_payment_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      setActivationUser(user as ActivationUser);
      setPaymentHistory((payments || []) as PaymentRecord[]);
      setActivationPlan(user?.plan_name || 'starter');
      setActivationMode('renewal');
      setActivationPaymentId('');
      setActivationSuccess('');
      setShowActivationModal(true);
    } catch (err) {
      alert('Error loading user: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  }, []);

  // ── SMART ACTIVATE ──
  const smartActivateUser = useCallback(async () => {
    if (!activationUser || !activationPlan) return;
    const config = FULL_PLAN_CONFIG[activationPlan];
    if (!config) return;

    setActivationLoading(true);
    setActivationSuccess('');

    try {
      const received = activationUser.total_leads_received || 0;
      const promised = activationUser.total_leads_promised || 0;
      const carryOver = Math.max(0, promised - received);

      let newTotalPromised: number;
      let newFreshQuota: number;
      let newRecycledQuota: number;
      let resetCounters: Record<string, number> = {};

      if (activationMode === 'renewal') {
        // Add new plan on top of existing promise — don't split carryover
        newTotalPromised = promised + config.totalLeads;
        // Add new plan's fresh/recycled to existing quotas
        newFreshQuota = (activationUser.fresh_leads_quota || 0) + config.freshCount;
        newRecycledQuota = (activationUser.recycled_leads_quota || 0) + config.recycledCount;
      } else {
        // Fresh start — reset everything
        newTotalPromised = config.totalLeads;
        newFreshQuota = config.freshCount;
        newRecycledQuota = config.recycledCount;
        resetCounters = { total_leads_received: 0, fresh_leads_received: 0, recycled_leads_received: 0 };
      }

      // Generate payment ID if not provided
      const paymentId = activationPaymentId.trim() ||
        `pay_ADMIN_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

      // Insert payment record
      const { error: payErr } = await supabase.from('payments').insert({
        user_id: activationUser.id,
        amount: config.price,
        status: 'captured',
        plan_name: activationPlan,
        razorpay_payment_id: paymentId,
        raw_payload: { note: 'Manual admin activation', mode: activationMode, activated_at: new Date().toISOString() }
      });
      if (payErr) throw payErr;

      // Update user
      const { error: userErr } = await supabase.from('users').update({
        plan_name: activationPlan,
        payment_status: 'active',
        is_active: true,
        is_online: true,
        is_new_system: true,
        is_plan_pending: false,
        daily_limit: config.dailyLeads,
        total_leads_promised: newTotalPromised,
        fresh_leads_quota: newFreshQuota,
        recycled_leads_quota: newRecycledQuota,
        leads_today: 0,
        plan_start_date: new Date().toISOString(),
        plan_activation_time: null,
        valid_until: '2099-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
        ...resetCounters
      }).eq('id', activationUser.id);
      if (userErr) throw userErr;

      const modeLabel = activationMode === 'renewal' ? 'Renewal' : 'Fresh Start';
      setActivationSuccess(`✅ ${modeLabel} done! ${activationPlan} activated. Total: ${newTotalPromised} leads (Fresh: ${newFreshQuota}, Recycled: ${newRecycledQuota}). Payment ID: ${paymentId}`);

      // Refresh modal data
      const { data: updated } = await supabase
        .from('payments').select('id, amount, status, plan_name, razorpay_payment_id, created_at')
        .eq('user_id', activationUser.id).order('created_at', { ascending: false }).limit(10);
      setPaymentHistory((updated || []) as PaymentRecord[]);

      await fetchOpsData();
      await fetchAnalytics();
    } catch (err) {
      alert('Activation failed: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setActivationLoading(false);
    }
  }, [activationUser, activationPlan, activationMode, activationPaymentId, fetchOpsData, fetchAnalytics]);

  // ── MISSED WEBHOOKS / PENDING ACTIVATIONS ──
  const fetchMissedPayments = useCallback(async () => {
    try {
      // Payments in last 30 days where user is not active
      const { data } = await supabase
        .from('payments')
        .select('id, user_id, amount, status, plan_name, razorpay_payment_id, created_at, users!inner(email, name, payment_status, plan_name)')
        .eq('status', 'captured')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const missed = (data || []).filter((p: any) =>
        p.users?.payment_status !== 'active' ||
        (p.plan_name !== p.users?.plan_name)
      ).map((p: any) => ({
        payment_id: p.id,
        razorpay_payment_id: p.razorpay_payment_id,
        user_id: p.user_id,
        user_email: p.users?.email || '',
        user_name: p.users?.name || '',
        amount: p.amount,
        plan_name: p.plan_name,
        payment_date: p.created_at,
        user_status: p.users?.payment_status || '',
        user_plan: p.users?.plan_name || ''
      }));

      setMissedPayments(missed as MissedPayment[]);
      setShowMissedPayments(true);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  }, []);

  const assignOrphanLead = useCallback(async (orphan: OrphanLeadRow, userId: string) => {
    setActionLoading(orphan.id);

    try {
      const { error: insertError } = await supabase.from('leads').insert({
        user_id: userId,
        name: orphan.name,
        phone: orphan.phone,
        city: orphan.city || 'Unknown',
        status: 'Fresh',
        source: 'orphan_assigned',
      });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('orphan_leads')
        .update({ status: 'assigned' })
        .eq('id', orphan.id);

      if (updateError) throw updateError;

      await fetchOpsData();
      await fetchAnalytics();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  }, [fetchOpsData, fetchAnalytics]);

  const handleBulkUpload = useCallback(async () => {
    if (!bulkData.trim()) return;
    setUploadStatus('Processing...');

    try {
      const lines = bulkData.trim().split('\n');
      let successCount = 0;

      for (const line of lines) {
        const [nameRaw, phoneRaw, cityRaw] = line.split(',').map(s => (s || '').trim());
        const name = nameRaw;
        const phone = (phoneRaw || '').replace(/\D/g, '').slice(-10);
        const city = cityRaw || 'Unknown';

        if (!name || phone.length < 10) continue;

        const { error } = await supabase.from('orphan_leads').insert({
          name,
          phone,
          city,
          status: 'pending',
          miss_reason: 'bulk_upload',
        });

        if (!error) successCount++;
      }

      setUploadStatus(`✅ Uploaded ${successCount} leads`);

      setTimeout(() => {
        setBulkData('');
        setUploadStatus('');
      }, 2000);

      await fetchOpsData();
      await fetchAnalytics();
    } catch (err) {
      setUploadStatus('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [bulkData, fetchOpsData, fetchAnalytics]);

  // ============================================================
  // 🧠 MANUAL LEAD DISTRIBUTION LOGIC
  // ============================================================

  const handleManualDistribute = useCallback(async () => {
    if (!assignData.trim()) return;
    setIsAssigning(true);
    setAssignLogs(['⏳ Starting distribution process...']);

    try {
      // 1. Parse Input
      const lines = assignData.trim().split('\n').filter(l => l.trim().length > 5);
      setAssignLogs(prev => [...prev, `🔍 Found ${lines.length} leads to process.`]);

      // 2. Fetch Eligible Users
      const { data: candidates, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .eq('is_online', true) // STRICTLY ONLINE ONLY
        .neq('plan_name', 'none');

      if (error) throw error;
      if (!candidates || candidates.length === 0) {
        throw new Error('No ONLINE active users found to receive leads.');
      }

      setAssignLogs(prev => [...prev, `👥 Found ${candidates.length} online candidates.`]);

      let processedCount = 0;
      const logs: string[] = [];

      // 3. Process Each Lead
      for (const line of lines) {
        // Parse CSV line (Name, Phone, City)
        const parts = line.split(',');
        const name = parts[0]?.trim() || 'Unknown';
        const rawPhone = parts[1]?.trim() || '';
        const city = parts[2]?.trim() || '';
        const phone = rawPhone.replace(/\D/g, '').slice(-10);

        if (phone.length !== 10) {
          logs.push(`⚠️ Skipped invalid phone: ${rawPhone}`);
          continue;
        }

        // 4. SORT CANDIDATES (Re-sort for every lead for strict fairness)
        candidates.sort((a, b) => {
          // Priority 1: Fewest Leads Today
          const diff = (a.leads_today || 0) - (b.leads_today || 0);
          if (diff !== 0) return diff;

          // Priority 2: Higher Plan Weight (Turbo > Manager > Starter)
          return (b.plan_weight || 0) - (a.plan_weight || 0);
        });

        // 5. Select Best User
        // Filter out those who hit daily limit
        const eligible = candidates.filter(u => (u.leads_today || 0) < (u.daily_limit || 0));

        if (eligible.length === 0) {
          logs.push(`⛔ STALLED: All online users reached daily limits! Remaining leads paused.`);
          break; // Stop processing
        }

        const selectedUser = eligible[0];

        // 6. Assign Lead
        const { error: insertError } = await supabase.from('leads').insert({
          user_id: selectedUser.id,
          assigned_to: selectedUser.id,
          name,
          phone,
          city,
          status: 'Assigned',
          source: 'Manual_Admin_Panel'
        });

        if (insertError) {
          logs.push(`❌ Failed to assign ${name}: ${insertError.message}`);
        } else {
          // 7. Update Local Counter (Critical for next iteration sort)
          selectedUser.leads_today = (selectedUser.leads_today || 0) + 1;
          const displayLimit = selectedUser.daily_limit_override || selectedUser.daily_limit || 0;
          logs.push(`✅ Assigned ${name} -> ${selectedUser.name} (${selectedUser.leads_today}/${displayLimit})`);
          processedCount++;
        }
      }

      setAssignLogs(prev => [...prev, ...logs, `🎉 Completed! Assigned ${processedCount} leads.`]);
      setAssignData(''); // Clear Input
      await fetchOpsData(); // Refresh Tables

    } catch (err: any) {
      setAssignLogs(prev => [...prev, `💥 Critical Error: ${err.message}`]);
    } finally {
      setIsAssigning(false);
    }
  }, [assignData, fetchOpsData]);

  // ============================================================
  // Export Functions
  // ============================================================

  const exportUsersCSV = useCallback(() => {
    const headers = ['Name', 'Email', 'Role', 'Plan', 'Status', 'Daily Limit', 'Leads Today', 'Valid Until', 'Created'];
    const rows = filteredAdminUsers.map(u => [
      u.name || '', u.email || '', u.role || '', u.plan_name || '', u.payment_status || '',
      String(u.daily_limit_override || u.daily_limit || ''), String(u.leads_today ?? ''),
      u.valid_until ? new Date(u.valid_until).toLocaleDateString() : '',
      u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportAnalytics = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      timeRange,
      stats,
      hourlyActivity,
      planAnalytics,
      userActivities
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, hourlyActivity, planAnalytics, userActivities, timeRange]);

  // ============================================================
  // Memoized Values
  // ============================================================

  const activeMembers = useMemo(
    () => adminUsers.filter(u => u.role === 'member' && u.payment_status === 'active' && u.is_active === true),
    [adminUsers]
  );

  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter(u => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        (u.name || '').toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.payment_status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [adminUsers, searchTerm, roleFilter, statusFilter]);

  const leadsForTimeRange = useMemo(() => {
    switch (timeRange) {
      case 'week': return stats.leadsDistributedWeek;
      case 'month': return stats.leadsDistributedMonth;
      default: return stats.leadsDistributedToday;
    }
  }, [timeRange, stats]);

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    fetchAnalytics();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAnalytics]);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchAnalytics, 30000);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, fetchAnalytics]);

  // ============================================================
  // Helper Functions
  // ============================================================

  const getStatusColorClass = (status: string): string => {
    return status === 'active'
      ? 'bg-green-100 text-green-700 hover:bg-green-200'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
  };

  const getRoleColorClass = (role: Role): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-purple-100 text-purple-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getPlanColorClass = (plan: string): string => {
    switch (plan) {
      case 'manager': return 'bg-purple-100 text-purple-700';
      case 'supervisor': return 'bg-blue-100 text-blue-700';
      case 'starter': return 'bg-green-100 text-green-700';
      case 'weekly_boost': return 'bg-orange-100 text-orange-700';
      case 'turbo_boost': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // ============================================================
  // Render: Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Main UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={28} />
                Analytics & Control Center
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time system analytics and user tracking
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <label className="flex items-center gap-2 text-sm bg-slate-100 px-3 py-2 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Live
              </label>

              <button
                onClick={exportAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Download size={16} />
                Export
              </button>

              <button
                onClick={fetchAnalytics}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>

              <button
                onClick={async () => { await fetchOpsData(); setShowUsersModal(true); }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                <Users size={16} />
                Users
              </button>

              <button
                onClick={async () => { await fetchOpsData(); setShowOrphansModal(true); }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                <AlertTriangle size={16} className="text-orange-500" />
                Orphans
                {stats.orphanLeads > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {stats.orphanLeads}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-md"
              >
                <div className="flex -space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-75" />
                </div>
                Manual Assign
              </button>

              <button
                onClick={fetchMissedPayments}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium shadow-md"
                title="Show payments that may not have activated user plan"
              >
                <Zap size={16} />
                Missed Webhooks
              </button>

              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header >

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={20} />
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Live Stats Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Wifi size={20} className="text-green-300 animate-pulse" />
                <span className="font-medium">{stats.onlineNow} Users Online Now</span>
              </div>

              <div className="flex items-center gap-2">
                <Activity size={20} />
                <span>{stats.dailyActiveUsers} DAU</span>
              </div>

              <div className="flex items-center gap-2">
                <Timer size={20} />
                <span>Avg Session: {stats.avgSessionDuration}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-green-300 font-bold text-lg">
                ₹{stats.dailyRevenue.toLocaleString()} Today
              </span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                MRR: ₹{stats.mrr.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            icon={<Users />}
            label="Total Users"
            value={stats.totalUsers}
            subValue={`${stats.dailyActiveUsers} active today`}
            color="blue"
          />

          <MetricCard
            icon={<UserCheck />}
            label="Active Today"
            value={stats.dailyActiveUsers}
            subValue={`${stats.totalUsers ? Math.round((stats.dailyActiveUsers / stats.totalUsers) * 100) : 0}% of total`}
            color="green"
          />

          <MetricCard
            icon={<Globe />}
            label="Online Now"
            value={stats.onlineNow}
            subValue="Live"
            color="emerald"
            pulse
          />

          <MetricCard
            icon={<Target />}
            label={`Leads (${timeRange})`}
            value={leadsForTimeRange}
            subValue={`${stats.leadsDistributedMonth} this month`}
            color="orange"
          />

          <MetricCard
            icon={<DollarSign />}
            label="Revenue Today"
            value={`₹${stats.dailyRevenue.toLocaleString()}`}
            subValue={`MRR: ₹${stats.mrr.toLocaleString()}`}
            color="purple"
          />

          <MetricCard
            icon={<AlertTriangle />}
            label="Queue/Orphan"
            value={`${stats.queuedLeads}/${stats.orphanLeads}`}
            subValue={stats.queuedLeads > 10 ? 'Needs attention' : 'Healthy'}
            color={stats.queuedLeads > 10 ? 'red' : 'green'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Hourly Activity Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} />
              24-Hour Activity Pattern
            </h2>

            <div className="space-y-4">
              {/* Logins */}
              <div>
                <p className="text-xs text-slate-500 mb-2">User Logins</p>
                <div className="flex items-end justify-between h-16 gap-0.5">
                  {hourlyActivity.map((hour) => {
                    const maxLogins = Math.max(...hourlyActivity.map(h => h.logins), 1);
                    const height = (hour.logins / maxLogins) * 100;
                    const isCurrentHour = new Date().getHours() === hour.hour;
                    const isWorkingHour = hour.hour >= 8 && hour.hour < 22;

                    return (
                      <div key={`login-${hour.hour}`} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full transition-all rounded-t ${isCurrentHour ? 'bg-blue-600' :
                            isWorkingHour ? 'bg-green-500' : 'bg-slate-300'
                            }`}
                          style={{ height: `${height}%`, minHeight: hour.logins > 0 ? '2px' : '0' }}
                          title={`${hour.hour}:00 - ${hour.logins} logins`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leads */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Lead Distribution</p>
                <div className="flex items-end justify-between h-16 gap-0.5">
                  {hourlyActivity.map((hour) => {
                    const maxLeads = Math.max(...hourlyActivity.map(h => h.leads), 1);
                    const height = (hour.leads / maxLeads) * 100;

                    return (
                      <div key={`lead-${hour.hour}`} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-orange-500 transition-all rounded-t"
                          style={{ height: `${height}%`, minHeight: hour.leads > 0 ? '2px' : '0' }}
                          title={`${hour.hour}:00 - ${hour.leads} leads`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Users */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Active Users</p>
                <div className="flex items-end justify-between h-16 gap-0.5">
                  {hourlyActivity.map((hour) => {
                    const maxActive = Math.max(...hourlyActivity.map(h => h.activeUsers), 1);
                    const height = (hour.activeUsers / maxActive) * 100;

                    return (
                      <div key={`active-${hour.hour}`} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-purple-500 transition-all rounded-t"
                          style={{ height: `${height}%`, minHeight: hour.activeUsers > 0 ? '2px' : '0' }}
                          title={`${hour.hour}:00 - ${hour.activeUsers} active`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Labels */}
              <div className="flex justify-between text-xs text-slate-400">
                {[0, 6, 12, 18, 23].map(h => (
                  <span key={h}>{h}:00</span>
                ))}
              </div>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <PieChart size={18} />
              Plan Distribution & Revenue
            </h2>

            <div className="space-y-3">
              {planAnalytics.length > 0 ? (
                planAnalytics.map((plan) => (
                  <div key={plan.planName} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800 capitalize">{plan.planName}</span>
                        {plan.planName === 'supervisor' && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{plan.userCount} users</span>
                        <span>₹{plan.revenue.toLocaleString()}</span>
                        <span>{plan.avgLeadsPerUser} leads/user</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Churn</div>
                      <div className={`font-semibold ${plan.churnRate < 5 ? 'text-green-600' : 'text-orange-600'}`}>
                        {plan.churnRate}%
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-xs text-slate-500">Satisfaction</div>
                      <div className={`font-semibold ${plan.satisfaction >= 90 ? 'text-green-600' : 'text-blue-600'}`}>
                        {plan.satisfaction}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No active plans found
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Total MRR</span>
                  <span className="text-xl font-bold text-slate-900">
                    ₹{stats.mrr.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Activity Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Activity size={18} />
              User Activity Monitor
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4">Logins</th>
                  <th className="p-4">Leads</th>
                  <th className="p-4">Conversion</th>
                  <th className="p-4">Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userActivities.slice(0, 10).map((activity) => (
                  <tr key={activity.userId} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-slate-900">{activity.name}</div>
                        <div className="text-xs text-slate-500">{activity.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPlanColorClass(activity.plan)}`}>
                        {activity.plan}
                      </span>
                    </td>
                    <td className="p-4">
                      {activity.isOnline ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Wifi size={14} />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400">
                          <WifiOff size={14} />
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600">
                        {activity.lastActive ? new Date(activity.lastActive).toLocaleString() : 'Never'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{activity.loginCount}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">
                        {activity.leadsReceived}/{activity.dailyLimitOverride || activity.dailyLimit || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${activity.conversionRate > 20 ? 'text-green-600' :
                        activity.conversionRate > 10 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {activity.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600">{activity.sessionTime}m</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 text-center border-t">
            <button
              onClick={async () => { await fetchOpsData(); setShowUsersModal(true); }}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              View All Users →
            </button>
          </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">System Uptime</p>
                <p className="text-3xl font-bold">{stats.systemUptime}%</p>
              </div>
              <CheckCircle size={32} className="text-green-200" />
            </div>
          </div>

          <div className={`bg-gradient-to-r ${stats.queuedLeads > 10 ? 'from-red-500 to-orange-500' : 'from-orange-400 to-amber-500'
            } text-white rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Queue Status</p>
                <p className="text-3xl font-bold">{stats.queuedLeads}</p>
                <p className="text-xs text-orange-200">leads pending</p>
              </div>
              <Timer size={32} className="text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Avg Response Time</p>
                <p className="text-3xl font-bold">1.2s</p>
                <p className="text-xs text-purple-200">API latency</p>
              </div>
              <Zap size={32} className="text-purple-200" />
            </div>
          </div>
        </div>

      </main>

      {/* ============================================================
          USERS MODAL
      ============================================================ */}
      {
        showUsersModal && (
          <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">

              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">👑 User Management</h3>
                  <p className="text-xs text-slate-500">Search • Activate/Deactivate • Change Plan • Delete</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportUsersCSV}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button
                    onClick={() => setShowUsersModal(false)}
                    className="p-2 rounded-lg hover:bg-slate-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                    placeholder="Search by name/email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | Role)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                </select>

                <select
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <button
                  onClick={fetchOpsData}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b sticky top-0">
                    <tr>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Leads</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAdminUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${u.is_online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`} title={u.is_online ? 'Online' : 'Offline'}></div>
                            <div className="font-bold text-slate-900">{u.name || 'No Name'}</div>
                          </div>
                          <div className="text-xs text-slate-500 pl-4">{u.email}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getRoleColorClass(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setShowPlanModal(u)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                          >
                            {u.plan_name || 'none'} <ChevronDown size={14} />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            disabled={actionLoading === u.id || u.role === 'admin'}
                            onClick={() => toggleUserStatus(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${getStatusColorClass(u.payment_status)} ${u.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === u.id ? (
                              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : u.payment_status === 'active' ? (
                              <UserCheck size={14} />
                            ) : (
                              <UserX size={14} />
                            )}
                            {u.payment_status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-3 text-center font-medium">
                          {u.leads_today ?? 0}/{u.daily_limit_override || u.daily_limit || 0}
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => openActivationModal(u.id)}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50"
                            title="Smart Activate / Renew Plan"
                          >
                            <Zap size={16} />
                          </button>
                          <button
                            onClick={() => setShowEditModal(u)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                            title="Edit User"
                          >
                            <Edit3 size={16} />
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              disabled={actionLoading === u.id}
                              onClick={() => deleteUser(u.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredAdminUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 border-t text-xs text-slate-500">
                Showing {filteredAdminUsers.length} of {adminUsers.length} users
              </div>
            </div>
          </div>
        )
      }

      {/* ============================================================
          ORPHANS MODAL
      ============================================================ */}
      {
        showOrphansModal && (
          <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">

              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">⚠️ Orphan Leads</h3>
                  <p className="text-xs text-slate-500">Bulk Upload • Assign to members</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUpload(v => !v)}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Upload size={16} /> Bulk Upload
                  </button>
                  <button
                    onClick={() => setShowOrphansModal(false)}
                    className="p-2 rounded-lg hover:bg-slate-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {showUpload && (
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="text-xs text-slate-600 mb-2">
                    Format: <b>Name, Phone, City</b> (one per line)
                  </div>
                  <textarea
                    className="w-full h-28 p-3 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-blue-500 bg-white"
                    placeholder="Rahul Kumar, 9999999999, Delhi&#10;Amit Singh, 8888888888, Mumbai"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm font-medium text-slate-600">{uploadStatus}</div>
                    <button
                      onClick={handleBulkUpload}
                      disabled={!bulkData.trim()}
                      className="px-5 py-2 rounded-lg bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
                    >
                      Upload
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto p-4">
                {orphanLeads.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <CheckCircle size={42} className="mx-auto mb-3 text-green-500" />
                    No orphan leads pending 🎉
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orphanLeads.map(orphan => (
                      <div
                        key={orphan.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{orphan.name}</div>
                          <div className="text-sm text-slate-600">
                            {orphan.phone} • {orphan.city || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Reason: {orphan.miss_reason || 'unknown'} • {new Date(orphan.created_at).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            disabled={actionLoading === orphan.id}
                            onChange={(e) => {
                              if (e.target.value) assignOrphanLead(orphan, e.target.value);
                            }}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[240px]"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Assign to member...
                            </option>
                            {activeMembers.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.leads_today ?? 0}/{m.daily_limit_override || m.daily_limit || 0})
                              </option>
                            ))}
                          </select>

                          {actionLoading === orphan.id && (
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t text-xs text-slate-500">
                Pending orphan leads: {orphanLeads.length}
              </div>
            </div>
          </div>
        )
      }

      {/* ============================================================
          PLAN CHANGE MODAL
      ============================================================ */}
      {
        showPlanModal && (
          <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">

              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Change Plan</h3>
                  <p className="text-xs text-slate-500">{showPlanModal.name} • {showPlanModal.email}</p>
                </div>
                <button
                  onClick={() => setShowPlanModal(null)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {planOptions.map(plan => (
                  <button
                    key={plan.id}
                    disabled={actionLoading === showPlanModal.id}
                    onClick={() => activatePlan(showPlanModal, plan.id)}
                    className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${(showPlanModal.plan_name || 'none') === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="text-left">
                      <div className="font-bold text-slate-900">{plan.name}</div>
                      <div className="text-xs text-slate-500">
                        {plan.daily_limit} leads/day • {plan.days} days • weight {plan.plan_weight}
                      </div>
                    </div>

                    {(showPlanModal.plan_name || 'none') === plan.id && (
                      <CheckCircle size={20} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* ============================================================
          MANUAL ASSIGN MODAL
      ============================================================ */}
      {
        showAssignModal && (
          <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">🚀 Manual Lead Distributor</h3>
                  <p className="text-xs text-slate-500">Smartly assign leads to ONLINE users based on priority logic.</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 rounded-lg hover:bg-slate-200"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-auto p-6 md:flex gap-6">
                {/* Input Section */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Paste Leads Data</label>
                    <p className="text-xs text-slate-500 mb-2">Format: <code>Name, Phone, City</code> (One per line)</p>
                    <textarea
                      className="w-full h-64 p-4 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder={`Amit Kumar, 9876543210, Delhi\nRahul Singh, 9988776655, Mumbai`}
                      value={assignData}
                      onChange={(e) => setAssignData(e.target.value)}
                      disabled={isAssigning}
                    />
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Strategy</label>
                      <select
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                        value={assignStrategy}
                        onChange={(e) => setAssignStrategy(e.target.value as any)}
                        disabled
                      >
                        <option value="smart_fair">⚡ Smart Equal Rotation (Fair)</option>
                        <option value="fill_quota">🌊 Fill Daily Quota (Fast)</option>
                      </select>
                    </div>
                    <button
                      onClick={handleManualDistribute}
                      disabled={isAssigning || !assignData.trim()}
                      className="h-10 px-6 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 mt-5 transition-all"
                    >
                      {isAssigning ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                      {isAssigning ? 'Distributing...' : 'Start Distribution'}
                    </button>
                  </div>
                </div>

                {/* Logs Section */}
                <div className="w-full md:w-1/3 bg-slate-900 rounded-xl p-4 flex flex-col h-64 md:h-auto">
                  <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex justify-between">
                    <span>Live Execution Logs</span>
                    {isAssigning && <span className="text-green-400 animate-pulse">● Running</span>}
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 pr-2 custom-scrollbar">
                    {assignLogs.length === 0 && <span className="text-slate-600 italic">Ready to process...</span>}
                    {assignLogs.map((log, i) => (
                      <div key={i} className={`break-words ${log.includes('❌') || log.includes('💥') || log.includes('⛔') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : log.includes('⚠️') ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )
      }

      {/* ============================================================
          USER QUICK EDIT MODAL
      ============================================================ */}
      {
        showEditModal && (
          <UserQuickEdit
            user={{
              id: showEditModal.id,
              name: showEditModal.name || '',
              email: showEditModal.email,
              daily_limit: showEditModal.daily_limit,
              daily_limit_override: showEditModal.daily_limit_override,
              leads_today: showEditModal.leads_today,
              plan_name: showEditModal.plan_name,
              is_active: showEditModal.payment_status === 'active'
            }}
            onClose={() => setShowEditModal(null)}
            onSave={() => {
              fetchOpsData();
              fetchAnalytics();
            }}
          />
        )
      }

      {/* ============================================================
          SMART ACTIVATION MODAL
      ============================================================ */}
      {showActivationModal && activationUser && (() => {
        const config = FULL_PLAN_CONFIG[activationPlan];
        const received = activationUser.total_leads_received || 0;
        const promised = activationUser.total_leads_promised || 0;
        const carryOver = Math.max(0, promised - received);
        const newTotal = activationMode === 'renewal'
          ? promised + (config?.totalLeads || 0)
          : (config?.totalLeads || 0);
        const newFresh = activationMode === 'renewal'
          ? (activationUser.fresh_leads_quota || 0) + (config?.freshCount || 0)
          : (config?.freshCount || 0);
        const newRecycled = activationMode === 'renewal'
          ? (activationUser.recycled_leads_quota || 0) + (config?.recycledCount || 0)
          : (config?.recycledCount || 0);

        return (
          <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">

              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Zap size={20} className="text-green-600" /> Smart Plan Activation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activationUser.name} • {activationUser.email}</p>
                </div>
                <button onClick={() => setShowActivationModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={20} /></button>
              </div>

              <div className="p-5 space-y-4">

                {/* Current State */}
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Current Plan</div>
                    <div className="font-bold text-slate-900 capitalize">{activationUser.plan_name || 'none'}</div>
                    <div className={`text-xs mt-0.5 font-medium ${activationUser.payment_status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                      {activationUser.payment_status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Leads Received</div>
                    <div className="font-bold text-slate-900">{received} / {promised}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Carry-over: <span className="text-blue-600 font-bold">{carryOver}</span></div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Fresh / Recycled</div>
                    <div className="font-bold text-slate-900">{activationUser.fresh_leads_received || 0}/{activationUser.recycled_leads_received || 0}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Quota: {activationUser.fresh_leads_quota || 0}/{activationUser.recycled_leads_quota || 0}</div>
                  </div>
                </div>

                {/* Mode */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Activation Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActivationMode('renewal')}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${activationMode === 'renewal' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-green-300'}`}
                    >
                      <div className="font-bold text-sm text-slate-900">Renewal / Carry-over</div>
                      <div className="text-xs text-slate-500 mt-0.5">Adds new plan on top of {carryOver} pending leads</div>
                    </button>
                    <button
                      onClick={() => setActivationMode('fresh')}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${activationMode === 'fresh' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'}`}
                    >
                      <div className="font-bold text-sm text-slate-900">Fresh Start</div>
                      <div className="text-xs text-slate-500 mt-0.5">Resets all counters. Only new plan leads.</div>
                    </button>
                  </div>
                </div>

                {/* Plan Select */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Select New Plan</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(FULL_PLAN_CONFIG).map(([id, cfg]) => (
                      <button
                        key={id}
                        onClick={() => setActivationPlan(id)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${activationPlan === id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                      >
                        <div className="text-left">
                          <span className="font-bold text-slate-900 capitalize">{id.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-500 ml-2">₹{cfg.price} • {cfg.dailyLeads}/day • {cfg.totalLeads} leads</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Fresh:{cfg.freshCount} Recycled:{cfg.recycledCount}
                        </div>
                        {activationPlan === id && <CheckCircle size={18} className="text-blue-600 ml-2 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment ID */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">
                    Razorpay Payment ID <span className="text-slate-400 font-normal">(optional — auto-generates if blank)</span>
                  </label>
                  <input
                    type="text"
                    value={activationPaymentId}
                    onChange={(e) => setActivationPaymentId(e.target.value)}
                    placeholder="pay_XXXXXXXXXX (leave blank to auto-generate)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Preview */}
                {config && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">After Activation Preview</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-slate-900">{newTotal}</div>
                        <div className="text-xs text-slate-500">Total Leads Promised</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-700">{newFresh}</div>
                        <div className="text-xs text-slate-500">Fresh Quota (40% carryover)</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-700">{newRecycled}</div>
                        <div className="text-xs text-slate-500">Recycled Quota (60% carryover)</div>
                      </div>
                    </div>
                    {activationMode === 'renewal' && carryOver > 0 && (
                      <div className="text-xs text-blue-600 mt-2 text-center">
                        {carryOver} pending carry-over + {config.totalLeads} new plan = {carryOver + config.totalLeads} total added
                      </div>
                    )}
                  </div>
                )}

                {/* Success Message */}
                {activationSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{activationSuccess}</div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={smartActivateUser}
                  disabled={!activationPlan || activationLoading}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {activationLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap size={18} />
                  )}
                  {activationLoading ? 'Activating...' : `Activate ${activationPlan.replace('_', ' ')} — ${activationMode === 'renewal' ? 'Renewal' : 'Fresh Start'}`}
                </button>

                {/* Payment History */}
                {paymentHistory.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Payment History</div>
                    <div className="space-y-1.5">
                      {paymentHistory.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                          <span className="font-mono text-slate-500">{p.razorpay_payment_id}</span>
                          <span className="font-medium text-slate-700 capitalize">{p.plan_name}</span>
                          <span className="text-green-700 font-bold">₹{p.amount}</span>
                          <span className="text-slate-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================
          MISSED WEBHOOKS MODAL
      ============================================================ */}
      {showMissedPayments && (
        <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">

            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Zap size={20} className="text-amber-600" /> Missed Webhooks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Payments captured in last 30 days where user plan may not be active</p>
              </div>
              <button onClick={() => setShowMissedPayments(false)} className="p-2 rounded-lg hover:bg-slate-100"><X size={20} /></button>
            </div>

            <div className="p-4">
              {missedPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
                  <p className="font-medium">All payments activated correctly!</p>
                  <p className="text-xs mt-1">No missed webhooks in last 30 days.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {missedPayments.map(mp => (
                    <div key={mp.payment_id} className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{mp.user_name}</div>
                          <div className="text-xs text-slate-500">{mp.user_email}</div>
                          <div className="text-xs font-mono text-slate-400 mt-1">{mp.razorpay_payment_id}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-700">₹{mp.amount}</div>
                          <div className="text-xs text-slate-500 capitalize">{mp.plan_name}</div>
                          <div className="text-xs text-slate-400">{new Date(mp.payment_date).toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs">
                          Current: <span className={`font-bold ${mp.user_status === 'active' ? 'text-green-600' : 'text-red-500'}`}>{mp.user_status}</span>
                          {' '}• Plan: <span className="font-bold capitalize">{mp.user_plan || 'none'}</span>
                          {mp.plan_name !== mp.user_plan && (
                            <span className="ml-2 text-amber-700 font-bold">⚠ Plan mismatch!</span>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            setShowMissedPayments(false);
                            await openActivationModal(mp.user_id);
                          }}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-bold hover:bg-green-700 flex items-center gap-1"
                        >
                          <Zap size={12} /> Activate Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div >
  );
};

// ============================================================
// Metric Card Component
// ============================================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: ColorType;
  pulse?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, subValue, color, pulse }) => {
  const colors: Record<ColorType, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative">
      {pulse && (
        <div className="absolute top-2 right-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
      )}

      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-2`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>

      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>

      {subValue && (
        <p className="text-xs text-slate-500 mt-1">{subValue}</p>
      )}
    </div>
  );
};

export default AdminDashboard;
