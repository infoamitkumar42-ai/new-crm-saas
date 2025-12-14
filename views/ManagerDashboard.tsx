import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { Users, UserPlus, Wallet, TrendingUp, Copy, Check } from 'lucide-react';

export const ManagerDashboard = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState({
    teamSize: 0,
    totalLeads: 0,
    converted: 0,
    revenue: 0 // ✅ Ab ye Real Hoga
  });
  const [teamCode, setTeamCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user.id) {
      fetchManagerStats();
    }
  }, [session]);

  const fetchManagerStats = async () => {
    try {
      const managerId = session?.user.id;

      // 1. Get Team Code & Team Size
      const { data: managerData } = await supabase
        .from('users')
        .select('team_code')
        .eq('id', managerId)
        .single();
      
      if (managerData) setTeamCode(managerData.team_code);

      const { count: teamCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', managerId);

      // 2. Get Total Leads for this Manager's Team
      const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', managerId);

      // 3. Get Converted Leads
      const { count: convertedCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', managerId)
        .eq('status', 'Converted'); // Ya jo bhi apka success status ho

      // 4. ✅ REAL REVENUE (Manager ne khud kitna pay kiya)
      const { data: payments } = await supabase
        .from('manager_payments')
        .select('amount')
        .eq('manager_id', managerId);
      
      const mySpend = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        teamSize: teamCount || 0,
        totalLeads: leadCount || 0,
        converted: convertedCount || 0,
        revenue: mySpend
      });

    } catch (error) {
      console.error('Error fetching manager stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8 text-center">Loading Stats...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
        <p className="text-slate-500">Monitor your team and subscription.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Users className="text-blue-600"/>} label="Team Members" value={stats.teamSize} />
        <StatCard icon={<UserPlus className="text-purple-600"/>} label="Total Leads" value={stats.totalLeads} />
        <StatCard icon={<TrendingUp className="text-green-600"/>} label="Converted" value={stats.converted} />
        {/* Ye ab 0 dikhayega jab tak payment nahi hoti */}
        <StatCard icon={<Wallet className="text-orange-600"/>} label="My Plan Expense" value={`₹${stats.revenue}`} />
      </div>

      {/* Team Code Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Invite Members</h2>
            <p className="text-blue-100">Share this code with your sales team to add them.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl flex items-center gap-4 border border-white/20">
            <span className="text-2xl font-mono font-bold tracking-widest px-4">{teamCode || 'NO-CODE'}</span>
            <button onClick={copyCode} className="bg-white text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors">
              {copied ? <Check size={20}/> : <Copy size={20}/>}
            </button>
          </div>
        </div>
      </div>

      {/* Yahan Team Table aayega (Jo already humne banaya tha) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-slate-500">
         (Team Performance Table - Already Implemented)
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <p className="text-slate-500 text-sm">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);
