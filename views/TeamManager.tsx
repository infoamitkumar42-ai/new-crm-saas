import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, TrendingUp, DollarSign, Award, Copy } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  payment_status: string;
  daily_limit: number;
  valid_until: string | null;
  referred_by?: string;
}

export const TeamManager: React.FC<{ managerId: string }> = ({ managerId }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    total_members: 0,
    active_members: 0,
    total_revenue: 0,
    commission: 0
  });

  useEffect(() => {
    if (managerId) loadTeamData();
  }, [managerId]);

  const loadTeamData = async () => {
    // Fetch team members
    const { data: members } = await supabase
      .from('users')
      .select('*')
      .eq('referred_by', managerId);

    const teamMembers = members || [];
    setTeam(teamMembers);

    // Calculate stats
    const active = teamMembers.filter((m: any) => m.payment_status === 'active').length;
    
    // Example: ₹999 per user (Replace with actual logic later)
    const revenue = active * 999;
    const commission = revenue * 0.20; // 20% commission

    setStats({
      total_members: teamMembers.length,
      active_members: active,
      total_revenue: revenue,
      commission: commission
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Team Dashboard</h1>
        <p className="text-slate-500">Manage your network and track earnings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Total Members</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.total_members}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-emerald-600">Active Now</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-700">{stats.active_members}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Team Revenue</span>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">₹{stats.total_revenue}</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600">Your Commission</span>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-700">₹{stats.commission}</p>
          <p className="text-xs text-blue-500 mt-1">20% of team earnings</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg mb-2">Your Referral Link</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            readOnly 
            value={`https://leadflow.app?ref=${managerId}`}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none"
          />
          <button 
            onClick={() => navigator.clipboard.writeText(`https://leadflow.app?ref=${managerId}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <Copy size={16} /> Copy
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Share this link to add members to your team!</p>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Your Team List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3 text-left">Member</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Plan</th>
                <th className="px-6 py-3 text-left">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No team members yet. Share your link!
                  </td>
                </tr>
              ) : (
                team.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{member.name}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        member.payment_status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {member.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{member.daily_limit}/day</td>
                    <td className="px-6 py-4 text-xs">
                      {member.valid_until ? new Date(member.valid_until).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
