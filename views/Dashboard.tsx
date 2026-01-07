/**
 * ============================================================================
 * DASHBOARD.TSX - FIXED WITH REAL-TIME NOTIFICATION & SOUND
 * ============================================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, ExternalLink, Phone, MapPin, Star, AlertCircle,
  Zap, Clock, TrendingUp, Users, Activity, BarChart3, Timer,
  CheckCircle, XCircle, RefreshCw, Bell, Target, Flame, Volume2
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
  const [audioEnabled, setAudioEnabled] = useState(false);

  // --- NEW: Notification Sound Logic ---
  const playNotificationSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio blocked: User must interact first", e));
    
    // Browser Push Notification
    if (Notification.permission === "granted") {
      new Notification("🚀 New Lead Assigned!", {
        body: "Check dashboard for details",
        icon: "/vite.svg"
      });
    }
  }, []);

  const enableAudio = () => {
    setAudioEnabled(true);
    Notification.requestPermission();
    // Play a silent sound to unlock audio context on mobile
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0;
    audio.play().then(() => {
      console.log("Audio Unlocked ✅");
    });
  };

  const isWithinWorkingHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 22;
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayLeads } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const distributed = todayLeads?.filter(l => l.user_id).length || 0;
      
      const { data: queueData } = await supabase.from('lead_queue').select('status');
      
      const queueStats = {
        pending: queueData?.filter(q => q.status === 'pending').length || 0,
        processing: queueData?.filter(q => q.status === 'processing').length || 0,
        completed: queueData?.filter(q => q.status === 'completed').length || 0,
        failed: queueData?.filter(q => q.status === 'failed').length || 0,
        nextRetryIn: calculateNextRetry()
      };
      
      const { count: orphanCount } = await supabase
        .from('orphan_leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const { data: activeUsers } = await supabase
        .from('users')
        .select('*')
        .eq('payment_status', 'active')
        .eq('role', 'member')
        .gt('valid_until', new Date().toISOString());
      
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
      
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('*, users!leads_user_id_fkey(name, email)')
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
        queue_time: Math.floor((new Date(l.assigned_at).getTime() - new Date(l.created_at).getTime()) / 1000)
      })) || [];
      
      const hourly = new Array(24).fill(0);
      todayLeads?.forEach(lead => {
        hourly[new Date(lead.created_at).getHours()]++;
      });
      
      setStats({
        totalLeadsToday: todayLeads?.length || 0,
        distributedToday: distributed,
        queuedLeads: queueStats.pending,
        orphanLeads: orphanCount || 0,
        activeUsers: activeUsers?.length || 0,
        distributionRate: todayLeads?.length > 0 ? Math.round((distributed / todayLeads.length) * 100) : 0,
        avgScore: recent.length > 0 ? Math.round(recent.reduce((sum, r) => sum + r.score, 0) / recent.length) : 0
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

  const calculateNextRetry = (): string => {
    const now = new Date();
    if (now.getHours() >= 22 || now.getHours() < 8) return 'Morning 8AM';
    return '30m';
  };

  useEffect(() => {
    fetchDashboardData();
    
    // REAL-TIME UPDATES WITH SOUND
    const channel = supabase
      .channel('dashboard-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        console.log("New lead detected! 🔔");
        playNotificationSound(); // Trigger Sound
        fetchDashboardData();    // Refresh UI
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_queue' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const interval = autoRefresh ? setInterval(fetchDashboardData, 60000) : null;

    return () => {
      if (interval) clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [autoRefresh, playNotificationSound]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Lead Distribution Dashboard</h1>
            <p className="text-sm text-slate-500">
              {isWithinWorkingHours() ? '🟢 Active' : '🔴 Off Hours'} • Auto-sync Enabled
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* AUDIO UNLOCK BUTTON */}
            <button
              onClick={enableAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                audioEnabled ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700 animate-pulse'
              }`}
            >
              <Volume2 size={16} />
              {audioEnabled ? 'Sound Active' : 'Enable Sound'}
            </button>

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

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={<Activity />} label="Today's Leads" value={stats.totalLeadsToday} change={`${stats.distributedToday} assigned`} color="blue" />
          <MetricCard icon={<Target />} label="Dist. Rate" value={`${stats.distributionRate}%`} change="Efficiency" color="green" />
          <MetricCard icon={<Timer />} label="In Queue" value={queueStatus.pending} change={`Failed: ${queueStatus.failed}`} color="orange" />
          <MetricCard icon={<Zap />} label="Avg Score" value={stats.avgScore} change="Lead Quality" color="purple" />
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b font-semibold bg-slate-50">Team Performance</div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[400px]">
            {userDistribution.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{u.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{u.plan_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{u.leads_today}/{u.daily_limit}</div>
                  <div className="w-20 h-1.5 bg-slate-200 rounded-full mt-1">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, u.percentage)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b font-semibold bg-slate-50">Recent Activity</div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[400px]">
            {recentDistributions.map(dist => (
              <div key={dist.id} className="flex items-center justify-between p-3 border-b border-slate-50">
                <div className="text-sm">
                  <div className="font-medium">{dist.lead_name}</div>
                  <div className="text-xs text-slate-500">{dist.lead_city} → {dist.assigned_to}</div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  {new Date(dist.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, change, color }: any) => {
  const styles: any = {
    blue: 'border-blue-100 bg-blue-50 text-blue-600',
    green: 'border-green-100 bg-green-50 text-green-600',
    orange: 'border-orange-100 bg-orange-50 text-orange-600',
    purple: 'border-purple-100 bg-purple-50 text-purple-600'
  };
  return (
    <div className={`p-4 rounded-xl border ${styles[color]}`}>
      <div className="mb-1">{icon}</div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] text-slate-500 font-medium uppercase">{label}</div>
      <div className="text-[10px] mt-1 opacity-80">{change}</div>
    </div>
  );
};

export default Dashboard;
