import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { Users, UserPlus, Wallet, TrendingUp, Copy, Check, LogOut, LayoutDashboard } from 'lucide-react';

export const ManagerDashboard = () => {
  const { session, signOut } = useAuth(); // 👈 signOut function yahan se liya
  const [stats, setStats] = useState({
    teamSize: 0,
    totalLeads: 0,
    converted: 0,
    revenue: 0 
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

      // 2. Get Total Leads
      const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', managerId);

      // 3. Get Converted
      const { count: convertedCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', managerId)
        .eq('status', 'Converted');

      // 4. Real Investment (My Expenses)
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* 👇 1. TOP NAVBAR ADDED (LOGOUT BUTTON KE SAATH) */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
                <LayoutDashboard size={20} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-800 leading-none">Manager Panel</h1>
                <p className="text-xs text-slate-500">Team Overview</p>
            </div>
        </div>

        <button 
            onClick={signOut} // 👈 Logout Logic
            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
        >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<Users className="text-blue-600"/>} 
            label="My Team" 
            value={stats.teamSize} 
            color="bg-blue-50"
          />
          <StatCard 
            icon={<UserPlus className="text-purple-600"/>} 
            label="Total Leads" 
            value={stats.totalLeads} 
            color="bg-purple-50"
          />
          <StatCard 
            icon={<TrendingUp className="text-green-600"/>} 
            label="Converted" 
            value={stats.converted} 
            color="bg-green-50"
          />
          
          {/* 👇 2. EXPENSES SECTION FIXED (Clearer Name) */}
          <StatCard 
            icon={<Wallet className="text-orange-600"/>} 
            label="Total Invested" 
            value={stats.revenue === 0 ? "Free Tier" : `₹${stats.revenue.toLocaleString()}`} 
            color="bg-orange-50"
          />
        </div>

        {/* Team Code Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white mb-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Grow Your Team</h2>
              <p className="text-blue-100">Share this unique code with your sales agents to add them automatically.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl flex items-center gap-4 border border-white/20 shadow-inner">
              <span className="text-3xl font-mono font-bold tracking-widest px-4 text-white">{teamCode || '...'}</span>
              <button 
                onClick={copyCode} 
                className="bg-white text-blue-600 p-3 rounded-lg hover:bg-blue-50 transition-colors shadow-md active:scale-95"
                title="Copy Code"
              >
                {copied ? <Check size={20}/> : <Copy size={20}/>}
              </button>
            </div>
          </div>
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-500/30 rounded-full blur-2xl"></div>
        </div>

        {/* Placeholder for future Charts/Tables */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
           <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
              <Users size={32} className="text-slate-400" />
           </div>
           <h3 className="text-lg font-bold text-slate-800">Team Performance</h3>
           <p className="text-slate-500">Member-wise analytics will appear here once they start calling.</p>
        </div>

      </main>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);
