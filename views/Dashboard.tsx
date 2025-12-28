import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, ExternalLink, Phone, MapPin, Star, AlertCircle,
  Zap, Clock, TrendingUp, Users, Activity, BarChart3, Timer,
  CheckCircle, XCircle, RefreshCw, Bell, Target, Flame
} from 'lucide-react';

// Types
interface DashboardStats {
  totalLeadsToday: number;
  distributedToday: number;
  queuedLeads: number;
  orphanLeads: number;
  activeUsers: number;
  distributionRate: number;
  avgScore: number;
}

interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  nextRetryIn: string;
}

interface UserDistribution {
  id: string;
  name: string;
  email: string;
  plan_name: string;
  plan_weight: number;
  leads_today: number;
  daily_limit: number;
  percentage: number;
  isBooster: boolean;
}

interface RecentDistribution {
  id: string;
  lead_name: string;
  lead_phone: string;
  lead_city: string;
  assigned_to: string;
  score: number;
  assigned_at: string;
  queue_time: number;
}

export const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeadsToday: 0,
    distributedToday: 0,
    queuedLeads: 0,
    orphanLeads: 0,
    activeUsers: 0,
    distributionRate: 0,
    avgScore: 0
  });
  
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    nextRetryIn: '--:--'
  });
  
  const [userDistribution, setUserDistribution] = useState<UserDistribution[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<RecentDistribution[]>([]);
  const [hourlyChart, setHourlyChart] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Current time check
  const isWithinWorkingHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 22;
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 1. Fetch Today's Stats
      const { data: todayLeads } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const distributed = todayLeads?.filter(l => l.user_id).length || 0;
      
      // 2. Fetch Queue Status
      const { data: queueData } = await supabase
        .from('lead_queue')
        .select('status');
      
      const queueStats = {
        pending: queueData?.filter(q => q.status === 'pending').length || 0,
        processing: queueData?.filter(q => q.status === 'processing').length || 0,
        completed: queueData?.filter(q => q.status === 'completed').length || 0,
        failed: queueData?.filter(q => q.status === 'failed').length || 0,
        nextRetryIn: calculateNextRetry()
      };
      
      // 3. Fetch Orphan Leads
      const { count: orphanCount } = await supabase
        .from('orphan_leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // 4. Fetch Active Users with Distribution
      const { data: activeUsers } = await supabase
        .from('users')
        .select('*')
        .eq('payment_status', 'active')
        .eq('role', 'member')
        .gt('valid_until', new Date().toISOString());
      
      // 5. Calculate User Distribution
      const distribution: UserDistribution[] = activeUsers?.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        plan_name: u.plan_name,
        plan_weight: u.plan_weight || 1,
        leads_today: u.leads_today || 0,
        daily_limit: u.daily_limit,
        percentage: ((u.leads_today || 0) / u.daily_limit) * 100,
        isBooster: ['fast_start', 'turbo_weekly', 'max_blast'].includes(u.plan_name)
      })) || [];
      
      // 6. Fetch Recent Distributions (with scores)
      const { data: recentLeads } = await supabase
        .from('leads')
        .select(`
          *,
          users!leads_user_id_fkey(name, email)
        `)
        .gte('created_at', today.toISOString())
        .not('user_id', 'is', null)
        .order('assigned_at', { ascending: false })
        .limit(10);
      
      const recent: RecentDistribution[] = recentLeads?.map(l => ({
        id: l.id,
        lead_name: l.name,
        lead_phone: l.phone,
        lead_city: l.city || 'Unknown',
        assigned_to: l.users?.name || 'Unknown User',
        score: l.distribution_score || 0,
        assigned_at: l.assigned_at,
        queue_time: calculateQueueTime(l.created_at, l.assigned_at)
      })) || [];
      
      // 7. Generate Hourly Chart Data
      const hourly = await generateHourlyChart(todayLeads);
      
      // 8. Calculate Average Score
      const avgScore = recent.length > 0
        ? Math.round(recent.reduce((sum, r) => sum + r.score, 0) / recent.length)
        : 0;
      
      // Update all states
      setStats({
        totalLeadsToday: todayLeads?.length || 0,
        distributedToday: distributed,
        queuedLeads: queueStats.pending,
        orphanLeads: orphanCount || 0,
        activeUsers: activeUsers?.length || 0,
        distributionRate: todayLeads?.length > 0 ? Math.round((distributed / todayLeads.length) * 100) : 0,
        avgScore
      });
      
      setQueueStatus(queueStats);
      setUserDistribution(distribution.sort((a, b) => b.leads_today - a.leads_today));
      setRecentDistributions(recent);
      setHourlyChart(hourly);
      
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate next retry time
  const calculateNextRetry = (): string => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 22 || hour < 8) {
      // Outside working hours, next retry at 8 AM
      const nextMorning = new Date(now);
      if (hour >= 22) {
        nextMorning.setDate(nextMorning.getDate() + 1);
      }
      nextMorning.setHours(8, 0, 0, 0);
      const diff = nextMorning.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m`;
    } else {
      // Within working hours, every 30 mins
      return '30m';
    }
  };

  // Calculate queue time
  const calculateQueueTime = (created: string, assigned: string): number => {
    if (!created || !assigned) return 0;
    const diff = new Date(assigned).getTime() - new Date(created).getTime();
    return Math.floor(diff / 1000); // seconds
  };

  // Generate hourly distribution chart
  const generateHourlyChart = async (leads: any[]): Promise<number[]> => {
    const hourly = new Array(24).fill(0);
    
    if (!leads) return hourly;
    
    leads.forEach(lead => {
      const hour = new Date(lead.created_at).getHours();
      hourly[hour]++;
    });
    
    return hourly;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  // Setup auto-refresh
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(() => {
      fetchDashboardData();
    }, 30000) : null;

    // Real-time subscription
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lead_queue'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      if (interval) clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Lead Distribution Dashboard</h1>
            <p className="text-sm text-slate-500">
              Real-time monitoring • {isWithinWorkingHours() ? '🟢 Working Hours' : '🔴 Off Hours'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Activity />}
            label="Today's Leads"
            value={stats.totalLeadsToday}
            change={`${stats.distributedToday} distributed`}
            color="blue"
          />
          
          <MetricCard
            icon={<Target />}
            label="Distribution Rate"
            value={`${stats.distributionRate}%`}
            change={stats.distributionRate >= 90 ? 'Excellent' : stats.distributionRate >= 70 ? 'Good' : 'Needs Attention'}
            color={stats.distributionRate >= 90 ? 'green' : stats.distributionRate >= 70 ? 'yellow' : 'red'}
          />
          
          <MetricCard
            icon={<Timer />}
            label="Queue Status"
            value={queueStatus.pending}
            change={`Next: ${queueStatus.nextRetryIn}`}
            color={queueStatus.pending > 10 ? 'orange' : 'green'}
          />
          
          <MetricCard
            icon={<Zap />}
            label="Avg Score"
            value={stats.avgScore}
            change="Hybrid scoring"
            color="purple"
          />
        </div>
      </div>

      {/* Queue Monitor */}
      {(queueStatus.pending > 0 || queueStatus.failed > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-orange-600" size={20} />
              <div>
                <p className="font-semibold text-orange-900">Queue Alert</p>
                <p className="text-sm text-orange-700">
                  {queueStatus.pending} leads pending • {queueStatus.failed} failed
                  {!isWithinWorkingHours() && ' • Will process at 8 AM'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                Processing: {queueStatus.processing}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Completed: {queueStatus.completed}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users size={18} />
              Active Users Distribution
            </h2>
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto">
            {userDistribution.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No active users</p>
            ) : (
              <div className="space-y-3">
                {userDistribution.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{user.name}</span>
                        {user.isBooster && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium flex items-center gap-1">
                            <Flame size={10} />
                            Booster
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {user.plan_name} • Weight: {user.plan_weight}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-slate-800">
                        {user.leads_today}/{user.daily_limit}
                      </div>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            user.percentage >= 100 ? 'bg-red-500' :
                            user.percentage >= 80 ? 'bg-orange-500' :
                            user.percentage >= 50 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, user.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Distributions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} />
              Recent Distributions
            </h2>
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto">
            {recentDistributions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No distributions today</p>
            ) : (
              <div className="space-y-3">
                {recentDistributions.map(dist => (
                  <div key={dist.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{dist.lead_name}</div>
                      <div className="text-xs text-slate-500">
                        <MapPin size={10} className="inline mr-1" />
                        {dist.lead_city} • Assigned to {dist.assigned_to}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={12} className="text-yellow-500" />
                        Score: {dist.score}
                      </div>
                      <div className="text-xs text-slate-500">
                        Queue: {formatTime(dist.queue_time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hourly Distribution Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={18} />
          Hourly Distribution (Today)
        </h2>
        
        <div className="flex items-end justify-between h-32 gap-1">
          {hourlyChart.map((count, hour) => {
            const maxCount = Math.max(...hourlyChart);
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isWorkingHour = hour >= 8 && hour < 22;
            const isCurrentHour = new Date().getHours() === hour;
            
            return (
              <div key={hour} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-1">{count > 0 ? count : ''}</span>
                  <div
                    className={`w-full transition-all rounded-t ${
                      isCurrentHour ? 'bg-blue-600' :
                      isWorkingHour ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                    style={{ height: `${height}px`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  {hour % 3 === 0 ? hour : ''}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            Working Hours (8 AM - 10 PM)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded" />
            Current Hour
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-300 rounded" />
            Off Hours
          </span>
        </div>
      </div>

    </div>
  );
};

// Metric Card Component
const MetricCard = ({ 
  icon, 
  label, 
  value, 
  change, 
  color 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: string;
  color: string;
}) => {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    red: 'border-red-200 bg-red-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  const iconColors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600'
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className={`${iconColors[color]} mb-2`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-600 font-medium">{label}</div>
      <div className="text-xs text-slate-500 mt-1">{change}</div>
    </div>
  );
};

export default Dashboard;
