import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, MapPin, Star, AlertCircle,
  Zap, Clock, Users, Activity, BarChart3, Timer,
  RefreshCw, Volume2, Target, Flame, TrendingUp,
  ExternalLink, Phone, CheckCircle, XCircle
} from 'lucide-react';

// --- Types ---
interface DashboardStats {
  totalLeadsToday: number; distributedToday: number;
  queuedLeads: number; orphanLeads: number;
  activeUsers: number; distributionRate: number; avgScore: number;
}

interface UserDistribution {
  id: string; name: string; email: string;
  plan_name: string; plan_weight: number;
  leads_today: number; daily_limit: number;
  percentage: number; isBooster: boolean; role?: string;
}

interface RecentDistribution {
  id: string; lead_name: string; lead_phone: string;
  lead_city: string; assigned_to: string;
  score: number; assigned_at: string; queue_time: number;
}

export const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('member');
  const [stats, setStats] = useState<DashboardStats>({
    totalLeadsToday: 0, distributedToday: 0, queuedLeads: 0,
    orphanLeads: 0, activeUsers: 0, distributionRate: 0, avgScore: 0
  });
  
  const [userDistribution, setUserDistribution] = useState<UserDistribution[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<RecentDistribution[]>([]);
  const [hourlyChart, setHourlyChart] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // --- Real-time Notification Sound ---
  const playNotificationSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio blocked", e));
    if (Notification.permission === "granted") {
      new Notification("🚀 New Lead Flowing!", { body: "Check LeadFlow Dashboard Now" });
    }
  }, []);

  const enableAudio = () => {
    setAudioEnabled(true);
    Notification.requestPermission();
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0; // Test play
    audio.play();
  };

  const isWithinWorkingHours = () => {
    const hour = new Date().getHours();
    return hour >= 8 && hour < 22;
  };

  // --- Main Data Fetcher ---
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // Get User Role (For Admin/Manager Check)
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
      setUserRole(profile?.role || 'member');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 1. Leads Logic
      const { data: todayLeads } = await supabase.from('leads').select('*')
        .gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString());

      const distributed = todayLeads?.filter(l => l.user_id).length || 0;
      
      // 2. Member Allocation Data
      const { data: activeUsers } = await supabase.from('users')
        .select('*').eq('payment_status', 'active');
      
      const distribution = activeUsers?.map(u => ({
        id: u.id, name: u.name, email: u.email, plan_name: u.plan_name,
        plan_weight: u.plan_weight || 1, leads_today: u.leads_today || 0,
        daily_limit: u.daily_limit, role: u.role,
        percentage: ((u.leads_today || 0) / u.daily_limit) * 100,
        isBooster: ['fast_start', 'turbo_weekly', 'max_blast'].includes(u.plan_name)
      })) || [];

      // 3. Recent Distributions (With Join)
      const { data: recentLeads } = await supabase.from('leads')
        .select('*, users!leads_user_id_fkey(name)')
        .gte('created_at', today.toISOString()).not('user_id', 'is', null)
        .order('assigned_at', { ascending: false }).limit(10);
      
      const recent = recentLeads?.map(l => ({
        id: l.id, lead_name: l.name, lead_phone: l.phone,
        lead_city: l.city || 'Unknown', assigned_to: l.users?.name || 'User',
        score: l.distribution_score || 0, assigned_at: l.assigned_at,
        queue_time: Math.floor((new Date(l.assigned_at).getTime() - new Date(l.created_at).getTime()) / 1000)
      })) || [];

      // 4. Hourly Chart Data
      const hourly = new Array(24).fill(0);
      todayLeads?.forEach(lead => { hourly[new Date(lead.created_at).getHours()]++; });

      setStats({
        totalLeadsToday: todayLeads?.length || 0, distributedToday: distributed,
        queuedLeads: 0, orphanLeads: 0, activeUsers: activeUsers?.filter(u => u.role === 'member').length || 0,
        distributionRate: todayLeads?.length > 0 ? Math.round((distributed / todayLeads.length) * 100) : 0,
        avgScore: 88
      });
      
      setUserDistribution(distribution.sort((a, b) => b.leads_today - a.leads_today));
      setRecentDistributions(recent);
      setHourlyChart(hourly);
      
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase.channel('realtime-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, () => {
        playNotificationSound();
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [playNotificationSound]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-400">Syncing LeadFlow...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      
      {/* --- HEADER SECTION --- */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">LeadFlow Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-widest flex items-center gap-2">
            {isWithinWorkingHours() ? '🟢 Working' : '🔴 Off-Hours'} • Role: {userRole}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={enableAudio} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${audioEnabled ? 'bg-green-100 text-green-700' : 'bg-orange-500 text-white animate-pulse shadow-orange-200'}`}>
            <Volume2 size={16} /> {audioEnabled ? 'Sound Active' : 'Unmute Sound'}
          </button>
          <button onClick={fetchDashboardData} disabled={refreshing} className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors">
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<Activity />} label="Daily Leads" value={stats.totalLeadsToday} change={`${stats.distributedToday} sent`} color="blue" />
        <MetricCard icon={<Target />} label="Efficiency" value={`${stats.distributionRate}%`} change="Auto-Dist" color="green" />
        <MetricCard icon={<Users />} label="Members" value={stats.activeUsers} change="Online" color="purple" />
        <MetricCard icon={<Zap />} label="Avg Score" value={stats.avgScore} change="Lead Quality" color="orange" />
      </div>

      {/* --- ALLOCATION TRACKER (Admin/Manager Only) --- */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-wider">
            <BarChart3 size={16} className="text-indigo-600" /> Team Allocation Live Status
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userDistribution.filter(u => u.role === 'member').map(member => (
              <div key={member.id} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                <div className="flex justify-between mb-3">
                  <span className="font-bold text-slate-800 truncate">{member.name}</span>
                  <span className="text-indigo-700 font-black">{member.leads_today} / {member.daily_limit}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div className={`h-full transition-all duration-1000 ${member.percentage >= 100 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, member.percentage)}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                  <span>{member.plan_name}</span>
                  <span>{Math.round(member.percentage)}% Used</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- RECENT ACTIVITY & CHART --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Distributions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-wider">
            <Clock size={16} className="text-blue-600" /> Recent Distributions
          </div>
          <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
            {recentDistributions.map(dist => (
              <div key={dist.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div>
                  <div className="font-bold text-sm text-slate-800">{dist.lead_name}</div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                    {dist.lead_city} • To: {dist.assigned_to}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400">
                    {new Date(dist.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-green-600 font-bold uppercase">
                    <CheckCircle size={8} /> Queue: {dist.queue_time}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Chart (Re-Integrated) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-700 mb-6 flex items-center gap-2 uppercase text-xs tracking-wider">
            <TrendingUp size={16} className="text-green-600" /> Hourly Activity
          </h2>
          <div className="flex items-end justify-between h-32 gap-1 px-2">
            {hourlyChart.map((count, hour) => {
              const maxCount = Math.max(...hourlyChart, 1);
              const height = (count / maxCount) * 100;
              const isCurrent = new Date().getHours() === hour;
              return (
                <div key={hour} className="flex-1 flex flex-col items-center">
                  <div className={`w-full rounded-t-sm transition-all duration-1000 ${isCurrent ? 'bg-indigo-600 shadow-lg' : 'bg-slate-200'}`} style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }} />
                  {hour % 4 === 0 && <span className="text-[8px] font-bold text-slate-400 mt-2">{hour}:00</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---
const MetricCard = ({ icon, label, value, change, color }: any) => {
  const styles: any = {
    blue: 'border-blue-100 bg-blue-50 text-blue-600',
    green: 'border-green-100 bg-green-50 text-green-600',
    orange: 'border-orange-100 bg-orange-50 text-orange-600',
    purple: 'border-purple-100 bg-purple-50 text-purple-600'
  };
  return (
    <div className={`p-5 rounded-2xl border ${styles[color]} shadow-sm`}>
      <div className="mb-2 opacity-80">{icon}</div>
      <div className="text-2xl font-black text-slate-800 tracking-tight">{value}</div>
      <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{label}</div>
      <div className="text-[9px] mt-1 font-bold opacity-70">{change}</div>
    </div>
  );
};

export default Dashboard;
