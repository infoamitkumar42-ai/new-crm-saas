import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Users, RefreshCw, CheckCircle, Clock, AlertTriangle, TrendingUp, Search } from 'lucide-react';

interface MemberStats {
  id: string;
  name: string;
  email: string;
  totalLeads: number;
  closedLeads: number;
  pendingLeads: number;
  lastActive: string;
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
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(userData);

      // 2. Get My Team Members
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .eq('manager_id', user.id);

      if (!teamMembers || teamMembers.length === 0) {
        setTeamStats([]);
        return;
      }

      // 3. Get Leads Data for ALL team members efficiently
      // Hum sabhi members ki leads ek saath mangwa lenge aur JS mein count karenge
      const memberIds = teamMembers.map(m => m.id);
      const { data: leadsData } = await supabase
        .from('leads')
        .select('assigned_to, status, created_at')
        .in('assigned_to', memberIds);

      // 4. Calculate Stats per Member
      const stats: MemberStats[] = teamMembers.map(member => {
        const memberLeads = leadsData?.filter(l => l.assigned_to === member.id) || [];
        const closed = memberLeads.filter(l => l.status === 'Closed').length;
        const fresh = memberLeads.filter(l => l.status === 'Fresh').length;
        
        return {
          id: member.id,
          name: member.name || 'Unknown',
          email: member.email,
          totalLeads: memberLeads.length,
          closedLeads: closed,
          pendingLeads: fresh,
          lastActive: new Date(member.created_at).toLocaleDateString() // Real app mein last_login track karenge
        };
      });

      setTeamStats(stats);

    } catch (error) {
      console.error("Manager Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredTeam = teamStats.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Team Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👔 Team Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manager Code: <span className="font-mono font-bold bg-yellow-100 px-2 py-0.5 rounded text-yellow-800">{profile?.team_code}</span>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Total Team</p>
                <h3 className="text-2xl font-bold">{teamStats.length}</h3>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Total Sales</p>
                <h3 className="text-2xl font-bold">{teamStats.reduce((acc, curr) => acc + curr.closedLeads, 0)}</h3>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><AlertTriangle size={24} /></div>
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Pending Leads</p>
                <h3 className="text-2xl font-bold">{teamStats.reduce((acc, curr) => acc + curr.pendingLeads, 0)}</h3>
            </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Live Team Performance</h3>
        </div>

        {filteredTeam.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <p className="font-medium">No members found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Member Name</th>
                  <th className="p-4 text-center">Received Leads</th>
                  <th className="p-4 text-center">Pending</th>
                  <th className="p-4 text-center">Closed (Sales)</th>
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
                    <td className="p-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
                            {member.totalLeads}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                        <span className="text-yellow-600 font-medium">{member.pendingLeads}</span>
                    </td>
                    <td className="p-4 text-center">
                        <span className="text-green-600 font-bold text-lg">{member.closedLeads}</span>
                    </td>
                    <td className="p-4 text-right pr-6">
                        {member.totalLeads > 0 ? (
                             <div className="flex items-center justify-end gap-2">
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500" 
                                        style={{ width: `${(member.closedLeads / member.totalLeads) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold text-slate-600">
                                    {Math.round((member.closedLeads / member.totalLeads) * 100)}%
                                </span>
                             </div>
                        ) : (
                            <span className="text-xs text-slate-400">No Data</span>
                        )}
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
