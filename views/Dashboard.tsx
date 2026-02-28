import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  LayoutDashboard, MapPin, Star, AlertCircle,
  Zap, Clock, Users, Activity, BarChart3, Timer,
  RefreshCw, Volume2, Target, Flame, TrendingUp,
  CheckCircle, ShieldAlert, Trash2
} from 'lucide-react';

// --- Interfaces ---
interface DashboardStats {
  totalLeadsToday: number; distributedToday: number;
  queuedLeads: number; orphanLeads: number;
  activeUsers: number; distributionRate: number; avgScore: number;
}

interface UserDistribution {
  id: string; name: string; email: string;
  plan_name: string; leads_today: number; daily_limit: number;
  percentage: number; role: string;
}

interface RecentDistribution {
  id: string; lead_name: string; lead_phone: string;
  lead_city: string; assigned_to: string; user_id: string;
  score: number; assigned_at: string; status: string;
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // --- Notification Sound ---
  const playNotificationSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio blocked", e));
  }, []);

  const enableAudio = () => {
    setAudioEnabled(true);
    Notification.requestPermission();
    playNotificationSound();
  };

  // --- REPLACEMENT LOGIC: Report Invalid Lead ---
  const handleReportLead = async (leadId: string, memberId: string) => {
    if (!window.confirm("क्या यह लीड सच में खराब है? रिपोर्ट करने पर आपको एक नई लीड मिलेगी।")) return;

    try {
      setRefreshing(true);
      // Supabase function call to handle logic
      const { error } = await supabase.rpc('report_invalid_lead', {
        lead_id: leadId,
        member_id: memberId
      });

      if (error) throw error;
      alert("Lead reported! Your limit has been reset for one lead. ✅");
      fetchDashboardData();
    } catch (err) {
      console.error("Report Error:", err);
      alert("Error reporting lead. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  // --- Fetch Dashboard Data ---
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);

      // Role check
      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single();
      setUserRole(profile?.role || 'member');

      // TIMEZONE FIX: IST Today Start
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayIST = new Date(now.getTime() + istOffset);
      todayIST.setUTCHours(0, 0, 0, 0);
      const startOfToday = new Date(todayIST.getTime() - istOffset).toISOString();

      // 1. Fetch Today's Leads (Using IST Start)
      const { data: todayLeads } = await supabase.from('leads').select('*')
        .gte('created_at', startOfToday);

      const distributed = todayLeads?.filter(l => l.user_id).length || 0;

      // 2. Fetch Allocation (All Active Users)
      const { data: activeUsers } = await supabase.from('users')
        .select('*').eq('payment_status', 'active');

      const distribution = activeUsers?.map(u => ({
        id: u.id, name: u.name, email: u.email, plan_name: u.plan_name,
        leads_today: u.leads_today || 0, daily_limit: u.daily_limit, role: u.role,
        percentage: ((u.leads_today || 0) / u.daily_limit) * 100,
      })) || [];

      // 3. Recent Activity (Show last 15 leads)
      const { data: recentLeads } = await supabase.from('leads')
        .select('*, users!leads_user_id_fkey(name)')
        .gte('created_at', startOfToday)
        .order('assigned_at', { ascending: false }).limit(15);

      const recent = recentLeads?.map(l => ({
        id: l.id, lead_name: l.name, lead_phone: l.phone, lead_city: l.city || 'Unknown',
        assigned_to: l.users?.name || 'User', user_id: l.user_id,
        score: l.distribution_score || 0, assigned_at: l.assigned_at, status: l.status
      })) || [];

      setStats({
        totalLeadsToday: todayLeads?.length || 0,
        distributedToday: distributed,
        queuedLeads: 0, orphanLeads: 0, activeUsers: activeUsers?.filter(u => u.role === 'member').length || 0,
        distributionRate: todayLeads?.length > 0 ? Math.round((distributed / todayLeads.length) * 100) : 0,
        avgScore: 88
      });

      setUserDistribution(distribution.sort((a, b) => b.leads_today - a.leads_today));
      setRecentDistributions(recent);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabaseRealtime.channel('global-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, () => {
        playNotificationSound();
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchDashboardData();
      })
      .subscribe();
    return () => { supabaseRealtime.removeChannel(channel); };
  }, [playNotificationSound]);

  if (loading) return <div className="p-10 text-center text-slate-400 animate-pulse font-bold">Connecting to LeadFlow...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 bg-slate-50/50 min-h-screen">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">LeadFlow Pro</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Monitoring • Role: {userRole}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={enableAudio} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${audioEnabled ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white animate-bounce shadow-indigo-200'}`}>
            <Volume2 size={16} className="inline mr-2" /> {audioEnabled ? 'Sound On' : 'Unmute Sound'}
          </button>
          <button onClick={fetchDashboardData} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm">
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* MAIN STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Activity />} label="Total Leads Today" value={stats.totalLeadsToday} color="blue" />
        <StatCard icon={<Target />} label="Distributed" value={stats.distributedToday} color="green" />
        <StatCard icon={<Users />} label="Active Members" value={stats.activeUsers} color="purple" />
        <StatCard icon={<TrendingUp />} label="Success Rate" value={`${stats.distributionRate}%`} color="orange" />
      </div>

      {/* ALLOCATION TRACKER (Admin/Manager) */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b font-black text-slate-700 text-xs tracking-widest flex items-center gap-2 uppercase">
            <BarChart3 size={16} className="text-indigo-600" /> Member Allocation Tracker
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userDistribution.filter(u => u.role === 'member').map(member => (
              <div key={member.id} className="p-5 border border-slate-100 rounded-2xl bg-white hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-slate-800 truncate">{member.name}</span>
                  <span className="text-indigo-700 font-black text-lg">{member.leads_today} <span className="text-[10px] text-slate-400">/ {member.daily_limit}</span></span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div className={`h-full transition-all duration-1000 ${member.percentage >= 100 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, member.percentage)}%` }} />
                </div>
                <p className="text-[10px] mt-2 font-black text-slate-400 uppercase tracking-tighter">{member.plan_name} • {Math.round(member.percentage)}% Capacity</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT ACTIVITY WITH REPORT BUTTON */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b font-black text-slate-700 text-xs tracking-widest flex items-center gap-2 uppercase">
          <Clock size={16} className="text-blue-600" /> Live Distribution Feed
        </div>
        <div className="divide-y divide-slate-50">
          {recentDistributions.map(dist => (
            <div key={dist.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${dist.status === 'invalid' ? 'bg-red-50 text-red-400 line-through' : 'bg-blue-50 text-blue-600'}`}>
                  <Zap size={18} />
                </div>
                <div>
                  <div className={`font-bold text-sm ${dist.status === 'invalid' ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{dist.lead_name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{dist.lead_city} • To: {dist.assigned_to}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-2">
                  <div className="text-[10px] font-black text-slate-400">{new Date(dist.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className={`text-[9px] font-bold uppercase ${dist.status === 'invalid' ? 'text-red-500' : 'text-green-500'}`}>{dist.status === 'invalid' ? 'Invalid' : 'Success'}</div>
                </div>
                {/* Report Button: Visible if lead is not already invalid AND user is the one who got it OR admin */}
                {dist.status !== 'invalid' && (dist.user_id === user?.id || userRole === 'admin') && (
                  <button
                    onClick={() => handleReportLead(dist.id, dist.user_id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Report Invalid Lead"
                  >
                    <ShieldAlert size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => {
  const styles: any = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', purple: 'bg-purple-50 text-purple-600', orange: 'bg-orange-50 text-orange-600' };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${styles[color]}`}>{icon}</div>
      <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
};

export default Dashboard;
