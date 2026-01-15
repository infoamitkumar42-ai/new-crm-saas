import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { 
  Users, UserPlus, Copy, Check, LogOut, 
  LayoutDashboard, RefreshCw, MessageSquare, Award,
  Target, UserCheck, Clock, Share2, TrendingUp
} from 'lucide-react';

// ============================================================
// Types & Interfaces
// ============================================================

interface TeamMember {
  id: string;
  name: string;
  email: string;
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

// Lead data structure for type safety
interface Lead {
  user_id: string;
  status: string;
}

// Strict color type
type ColorType = 'blue' | 'green' | 'purple' | 'orange' | 'emerald' | 'pink';

// ============================================================
// Component
// ============================================================

export const ManagerDashboard = () => {
  const { session, signOut } = useAuth();
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
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for setTimeout cleanup to prevent memory leaks
  const timeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================
  // Optimized Data Fetch (N+1 Fixed)
  // ============================================================
  
  const fetchManagerData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null); // Clear previous errors
      
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

      // 3. OPTIMIZATION: Fetch leads in ONE query (N+1 Fix)
      const memberIds = (members || []).map(m => m.id);
      
      let leadsMap: { [key: string]: { total: number; interested: number; closed: number } } = {};
      
      if (memberIds.length > 0) {
        // Fetch all leads for the team at once
        const { data: leads } = await supabase
          .from('leads')
          .select('user_id, status')
          .in('user_id', memberIds);

        // Aggregate counts in JS (Fast & Memory Efficient)
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

      // 4. Merge stats back into member list
      const membersWithStats = (members || []).map((member) => {
        const stats = leadsMap[member.id] || { total: 0, interested: 0, closed: 0 };
        return {
          ...member,
          total_leads: stats.total,
          interested_leads: stats.interested,
          closed_leads: stats.closed
        };
      });

      setTeamMembers(membersWithStats);

      // 5. Calculate Overall Stats
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
  // Helper Functions (With Fixes)
  // ============================================================
  
  const copyCode = useCallback(() => {
    if (!teamCode) return;
    navigator.clipboard.writeText(teamCode).then(() => {
      setCopied(true);
      
      // Cleanup previous timeout to prevent memory leak
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
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

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getPlanColor = (plan: string) => {
    switch(plan) {
      case 'starter': return 'bg-blue-50 text-blue-700';
      case 'supervisor': return 'bg-purple-50 text-purple-700';
      case 'manager': return 'bg-orange-50 text-orange-700';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // ============================================================
  // Effects (With Cleanup)
  // ============================================================
  
  useEffect(() => {
    if (session?.user.id) {
      fetchManagerData();
    }
  }, [session?.user.id, fetchManagerData]);

  // Cleanup effect for timers
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading Team Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
                <LayoutDashboard size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Manager Panel</h1>
                <p className="text-xs text-slate-500">Team Overview & Analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={fetchManagerData}
                disabled={refreshing}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                <RefreshCw size={18} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button 
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Error Alert (New Feature) */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-red-500 p-2 bg-white rounded-full">
                <RefreshCw size={20} />
              </div>
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
            <button 
              onClick={fetchManagerData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Team Code Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full -ml-16 -mb-16 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Share2 size={24} /> Grow Your Team
                </h2>
                <p className="text-blue-100 text-sm max-w-md">
                  Share your unique code with sales agents. They'll automatically join your team on signup!
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl flex items-center gap-3 border border-white/20">
                  <span className="text-2xl sm:text-3xl font-mono font-bold tracking-widest px-2">
                    {teamCode || 'NO CODE'}
                  </span>
                  <button 
                    onClick={copyCode} 
                    className="bg-white text-blue-600 p-2.5 rounded-lg hover:bg-blue-50 transition-colors shadow-md"
                    title="Copy Code"
                  >
                    {copied ? <Check size={20}/> : <Copy size={20}/>}
                  </button>
                </div>
                
                <button 
                  onClick={shareOnWhatsApp}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                  <MessageSquare size={20} />
                  <span>Share on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard 
            icon={<Users size={20} />} 
            label="Team Size" 
            value={stats.teamSize} 
            color="blue"
          />
          <StatCard 
            icon={<UserCheck size={20} />} 
            label="Active" 
            value={stats.activeMembers} 
            color="green"
          />
          <StatCard 
            icon={<Target size={20} />} 
            label="Total Leads" 
            value={stats.totalLeads} 
            color="purple"
          />
          <StatCard 
            icon={<Clock size={20} />} 
            label="Interested" 
            value={stats.interestedLeads} 
            color="orange"
          />
          <StatCard 
            icon={<Award size={20} />} 
            label="Closed" 
            value={stats.closedLeads} 
            color="emerald"
          />
          <StatCard 
            icon={<TrendingUp size={20} />} 
            label="Conversion" 
            value={`${stats.conversionRate}%`} 
            color="pink"
          />
        </div>

        {/* Team Members Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} /> Team Members ({teamMembers.length})
            </h3>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Team Members Yet</h3>
              <p className="text-slate-500 mb-4 max-w-sm mx-auto">
                Share your team code <span className="font-mono font-bold text-blue-600">{teamCode}</span> with agents to grow your team!
              </p>
              <button 
                onClick={shareOnWhatsApp}
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-600 transition-all"
              >
                <MessageSquare size={18} /> Invite via WhatsApp
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs">
                    <tr>
                      <th className="p-4 pl-6">Member</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4 text-center">Total Leads</th>
                      <th className="p-4 text-center">Interested</th>
                      <th className="p-4 text-center">Closed</th>
                      <th className="p-4 text-center">Today</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900">{member.name || 'No Name'}</div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(member.payment_status)}`}>
                            {member.payment_status === 'active' ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getPlanColor(member.plan_name)}`}>
                            {member.plan_name || 'None'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-slate-900">{member.total_leads}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-orange-600">{member.interested_leads}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-green-600">{member.closed_leads}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-slate-600">
                            {member.leads_today} / {member.daily_limit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {teamMembers.map((member) => (
                  <div key={member.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-slate-900">{member.name || 'No Name'}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(member.payment_status)}`}>
                        {member.payment_status === 'active' ? 'Active' : 'Inactive'}
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
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-slate-900">{member.total_leads}</div>
                        <div className="text-xs text-slate-500">Total</div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-orange-600">{member.interested_leads}</div>
                        <div className="text-xs text-orange-600">Interested</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg text-center">
                        <div className="text-lg font-bold text-green-600">{member.closed_leads}</div>
                        <div className="text-xs text-green-600">Closed</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Performance Tip */}
        <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Award size={20} className="text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-800">Pro Tip: Boost Conversions</h4>
            <p className="text-sm text-amber-700">
              Members who follow up within 5 minutes have 21x higher conversion rates! 
              Encourage your team to call leads immediately.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};

// ============================================================
// Stat Card Component (Type-Safe)
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
  color: ColorType; // Strict type checking
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
