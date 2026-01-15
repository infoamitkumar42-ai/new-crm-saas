import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import {
  Users, UserPlus, Copy, Check, LogOut,
  LayoutDashboard, RefreshCw, MessageSquare, Award,
  Target, UserCheck, Clock, Share2, TrendingUp,
  Phone, Download, Trophy, Medal, Crown,
  ChevronRight, BarChart3, Calendar
} from 'lucide-react';

// ============================================================
// Types & Interfaces
// ============================================================

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  payment_status: string;
  plan_name: string;
  daily_limit: number;
  leads_today: number;
  created_at: string;
  total_leads?: number;
  interested_leads?: number;
  closed_leads?: number;
}

interface Stats {
  teamSize: number;
  activeMembers: number;
  totalLeads: number;
  interestedLeads: number;
  closedLeads: number;
  conversionRate: number;
}

interface DailyStats {
  date: string;
  leads: number;
}

interface Lead {
  user_id: string;
  status: string;
  created_at?: string;
}

type ColorType = 'blue' | 'green' | 'purple' | 'orange' | 'emerald' | 'pink';
type TabType = 'overview' | 'team' | 'analytics';

// ============================================================
// Component
// ============================================================

export const ManagerDashboard = () => {
  const { session, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<Stats>({
    teamSize: 0,
    activeMembers: 0,
    totalLeads: 0,
    interestedLeads: 0,
    closedLeads: 0,
    conversionRate: 0
  });
  const [teamCode, setTeamCode] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================
  // Optimized Data Fetch
  // ============================================================

  const fetchManagerData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const managerId = session?.user.id;
      if (!managerId) {
        setError("User session not found. Please login again.");
        return;
      }

      // 1. Get Manager's Team Code
      const { data: managerData } = await supabase
        .from('users')
        .select('team_code, name')
        .eq('id', managerId)
        .single();

      if (managerData?.team_code) {
        setTeamCode(managerData.team_code);
      }

      // 2. Get Team Members
      const { data: members } = await supabase
        .from('users')
        .select('*')
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false });

      // 3. Fetch all leads for the team
      const memberIds = (members || []).map(m => m.id);
      let leadsMap: { [key: string]: { total: number; interested: number; closed: number } } = {};
      let allLeads: Lead[] = [];

      if (memberIds.length > 0) {
        const { data: leads } = await supabase
          .from('leads')
          .select('user_id, status, created_at')
          .in('user_id', memberIds);

        allLeads = leads || [];

        if (leads) {
          leads.forEach((lead: Lead) => {
            if (!leadsMap[lead.user_id]) {
              leadsMap[lead.user_id] = { total: 0, interested: 0, closed: 0 };
            }
            leadsMap[lead.user_id].total++;
            if (lead.status === 'Interested') leadsMap[lead.user_id].interested++;
            if (lead.status === 'Closed') leadsMap[lead.user_id].closed++;
          });
        }
      }

      // 4. Calculate Weekly Stats
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const dailyLeadCounts = last7Days.map(date => {
        const count = allLeads.filter(lead =>
          lead.created_at?.startsWith(date)
        ).length;
        return { date, leads: count };
      });

      setWeeklyStats(dailyLeadCounts);

      // 5. Merge stats into member list
      const membersWithStats = (members || []).map((member) => {
        const memberStats = leadsMap[member.id] || { total: 0, interested: 0, closed: 0 };
        return {
          ...member,
          total_leads: memberStats.total,
          interested_leads: memberStats.interested,
          closed_leads: memberStats.closed
        };
      });

      setTeamMembers(membersWithStats);

      // 6. Calculate Overall Stats
      const totalLeads = membersWithStats.reduce((sum, m) => sum + (m.total_leads || 0), 0);
      const interestedLeads = membersWithStats.reduce((sum, m) => sum + (m.interested_leads || 0), 0);
      const closedLeads = membersWithStats.reduce((sum, m) => sum + (m.closed_leads || 0), 0);
      const activeMembers = membersWithStats.filter(m => m.payment_status === 'active').length;

      setStats({
        teamSize: membersWithStats.length,
        activeMembers,
        totalLeads,
        interestedLeads,
        closedLeads,
        conversionRate: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0
      });

    } catch (err) {
      console.error('Error fetching manager data:', err);
      setError("Unable to load team data. Please refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user.id]);

  // ============================================================
  // Helper Functions
  // ============================================================

  const copyCode = useCallback(() => {
    if (!teamCode) return;
    navigator.clipboard.writeText(teamCode).then(() => {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [teamCode]);

  const shareOnWhatsApp = useCallback(() => {
    if (!teamCode) return;
    const message = encodeURIComponent(
      `🚀 Join my team on LeadFlow!\n\n` +
      `Use my Team Code: *${teamCode}*\n\n` +
      `Sign up here: ${window.location.origin}/login\n\n` +
      `Get daily fresh leads and grow your business! 💰`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }, [teamCode]);

  const messageOnWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hi ${name}! 👋`);
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  const callMember = (phone: string) => {
    window.open(`tel:+91${phone}`, '_self');
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Plan', 'Status', 'Total Leads', 'Interested', 'Closed'];
    const rows = teamMembers.map(m => [
      m.name, m.email, m.phone || '', m.plan_name, m.payment_status,
      m.total_leads, m.interested_leads, m.closed_leads
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-blue-50 text-blue-700';
      case 'supervisor': return 'bg-purple-50 text-purple-700';
      case 'manager': return 'bg-orange-50 text-orange-700';
      case 'weekly_boost': return 'bg-pink-50 text-pink-700';
      case 'turbo_boost': return 'bg-red-50 text-red-700';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getTop3Performers = () => {
    return [...teamMembers]
      .sort((a, b) => (b.closed_leads || 0) - (a.closed_leads || 0))
      .slice(0, 3);
  };

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    if (session?.user.id) {
      fetchManagerData();
    }
  }, [session?.user.id, fetchManagerData]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const maxLeadsInWeek = Math.max(...weeklyStats.map(d => d.leads), 1);
  const top3 = getTop3Performers();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 md:pb-0">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <LayoutDashboard size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Manager Dashboard</h1>
                <p className="text-xs text-blue-100">Team Performance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchManagerData}
                disabled={refreshing}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={signOut}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-700 font-medium text-sm">{error}</p>
            <button onClick={fetchManagerData} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">
              Retry
            </button>
          </div>
        )}

        {/* Team Code Card */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white mb-4 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Your Team Code</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold tracking-widest">{teamCode || 'NO CODE'}</span>
                <button onClick={copyCode} className="bg-white/10 p-2 rounded-lg hover:bg-white/20">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={shareOnWhatsApp}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2.5 rounded-xl font-bold text-sm w-full sm:w-auto justify-center"
            >
              <MessageSquare size={18} />
              Share on WhatsApp
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
            <Users size={20} className="text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{stats.teamSize}</p>
            <p className="text-xs text-slate-500">Team</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
            <Target size={20} className="text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{stats.totalLeads}</p>
            <p className="text-xs text-slate-500">Leads</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
            <TrendingUp size={20} className="text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{stats.conversionRate}%</p>
            <p className="text-xs text-slate-500">Conv.</p>
          </div>
        </div>

        {/* Tab Content based on activeTab */}
        {activeTab === 'overview' && (
          <>
            {/* Weekly Chart */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-500" />
                  Last 7 Days
                </h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar size={14} /> Weekly
                </span>
              </div>

              <div className="flex items-end justify-between h-32 gap-2">
                {weeklyStats.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(day.leads / maxLeadsInWeek) * 100}%`, minHeight: day.leads > 0 ? '8px' : '2px' }}
                    />
                    <span className="text-xs text-slate-500 mt-2">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).charAt(0)}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{day.leads}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-yellow-500" />
                Top Performers
              </h3>

              {top3.length > 0 ? (
                <div className="space-y-3">
                  {top3.map((member, i) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-yellow-100' : i === 1 ? 'bg-slate-200' : 'bg-orange-100'
                        }`}>
                        {i === 0 ? <Crown size={20} className="text-yellow-600" /> :
                          i === 1 ? <Medal size={20} className="text-slate-600" /> :
                            <Award size={20} className="text-orange-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.closed_leads || 0} closed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{member.total_leads || 0}</p>
                        <p className="text-xs text-slate-500">leads</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-4">No team members yet</p>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl text-white">
                <UserCheck size={24} className="mb-2 opacity-80" />
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
                <p className="text-xs opacity-80">Active Members</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-xl text-white">
                <Award size={24} className="mb-2 opacity-80" />
                <p className="text-2xl font-bold">{stats.closedLeads}</p>
                <p className="text-xs opacity-80">Total Closed</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} />
                Team ({teamMembers.length})
              </h3>
              <button onClick={exportCSV} className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                <Download size={16} />
                Export
              </button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="p-8 text-center">
                <UserPlus size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No team members yet</p>
                <button onClick={shareOnWhatsApp} className="mt-3 text-sm text-blue-600 font-medium">
                  Invite Members →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {teamMembers.map((member) => (
                  <div key={member.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-900">{member.name || 'No Name'}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(member.payment_status)}`}>
                        {member.payment_status === 'active' ? '● Active' : '○ Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPlanColor(member.plan_name)}`}>
                        {member.plan_name || 'No Plan'}
                      </span>
                      <span className="text-xs text-slate-500">
                        Today: {member.leads_today}/{member.daily_limit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                          📊 {member.total_leads || 0}
                        </span>
                        <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs">
                          🔥 {member.interested_leads || 0}
                        </span>
                        <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-xs">
                          ✅ {member.closed_leads || 0}
                        </span>
                      </div>

                      {member.phone && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => messageOnWhatsApp(member.phone!, member.name)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            onClick={() => callMember(member.phone!)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg"
                          >
                            <Phone size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <>
            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard icon={<Users size={20} />} label="Team Size" value={stats.teamSize} color="blue" />
              <StatCard icon={<UserCheck size={20} />} label="Active" value={stats.activeMembers} color="green" />
              <StatCard icon={<Target size={20} />} label="Total Leads" value={stats.totalLeads} color="purple" />
              <StatCard icon={<Clock size={20} />} label="Interested" value={stats.interestedLeads} color="orange" />
              <StatCard icon={<Award size={20} />} label="Closed" value={stats.closedLeads} color="emerald" />
              <StatCard icon={<TrendingUp size={20} />} label="Conversion" value={`${stats.conversionRate}%`} color="pink" />
            </div>

            {/* Performance Tip */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Award size={20} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-800">Pro Tip</h4>
                  <p className="text-sm text-amber-700">
                    Members who follow up within 5 minutes have 21x higher conversion rates!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-50">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-xs mt-1 font-medium">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl ${activeTab === 'team' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}
          >
            <Users size={20} />
            <span className="text-xs mt-1 font-medium">Team</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}
          >
            <BarChart3 size={20} />
            <span className="text-xs mt-1 font-medium">Analytics</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// ============================================================
// Stat Card Component
// ============================================================

const StatCard = ({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: ColorType;
}) => {
  const colors: Record<ColorType, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
};

export default ManagerDashboard;
