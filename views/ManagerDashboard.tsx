import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Users, RefreshCw, AlertTriangle, TrendingUp, Search, Crown, Shield } from 'lucide-react';

interface MemberStats {
  id: string;
  name: string;
  email: string;
  plan: string; // 👈 New: Plan Logic
  totalLeads: number;
  closedLeads: number;
  pendingLeads: number;
}

export const ManagerDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teamStats, setTeamStats] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get My Profile
      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
      setProfile(userData);

      // 2. Get My Team Members (With Plan Info)
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id, name, email, plan, created_at') // 👈 Fetching 'plan'
        .eq('manager_id', user.id);

      if (!teamMembers || teamMembers.length === 0) {
        setTeamStats([]);
        return;
      }

      // 3. Get Leads Data for stats
      const memberIds = teamMembers.map(m => m.id);
      const { data: leadsData } = await supabase
        .from('leads')
        .select('assigned_to, status')
        .in('assigned_to', memberIds);

      // 4. Calculate Stats
      const stats: MemberStats[] = teamMembers.map(member => {
        const memberLeads = leadsData?.filter(l => l.assigned_to === member.id) || [];
        return {
          id: member.id,
          name: member.name || 'Unknown',
          email: member.email,
          plan: member.plan || 'Free', // 👈 Plan Value
          totalLeads: memberLeads.length,
          closedLeads: memberLeads.filter(l => l.status === 'Closed').length,
          pendingLeads: memberLeads.filter(l => l.status === 'Fresh').length,
        };
      });

      setTeamStats(stats);

    } catch (error) {
      console.error("Manager Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeam = teamStats.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Team Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👔 Team Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manager Code: <span className="bg-yellow-100 px-2 py-0.5 rounded text-yellow-800 font-bold">{profile?.team_code}</span>
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search member..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button onClick={fetchManagerData} className="p-2 bg-white border rounded-lg shadow-sm hover:bg-slate-50">
                <RefreshCw size={20} className="text-slate-600" />
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">Total Team</p><h3 className="text-2xl font-bold">{teamStats.length}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Crown size={24} /></div>
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Paid Members</p>
                <h3 className="text-2xl font-bold">{teamStats.filter(m => m.plan !== 'Free').length}</h3>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">Total Sales</p><h3 className="text-2xl font-bold">{teamStats.reduce((acc, curr) => acc + curr.closedLeads, 0)}</h3></div>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50"><h3 className="font-bold text-slate-800">Team Details</h3></div>

        {filteredTeam.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs">
                <tr>
                  <th className="p-4 pl-6">Member</th>
                  <th className="p-4">Active Plan</th> {/* 👈 New Column */}
                  <th className="p-4 text-center">Leads Got</th>
                  <th className="p-4 text-center">Sales Closed</th>
                  <th className="p-4 text-right pr-6">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTeam.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                            member.plan.includes('999') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            member.plan.includes('499') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                            {member.plan}
                        </span>
                    </td>
                    <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded font-bold">{member.totalLeads}</span></td>
                    <td className="p-4 text-center"><span className="text-green-600 font-bold text-lg">{member.closedLeads}</span></td>
                    <td className="p-4 text-right pr-6">
                        <span className="text-xs font-bold text-slate-600">
                            {member.totalLeads > 0 ? Math.round((member.closedLeads / member.totalLeads) * 100) : 0}%
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
