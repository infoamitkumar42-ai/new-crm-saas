import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, ExternalLink, Phone, MapPin, Star, AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch User & Leads
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Get User Data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setUser(userData);

      // 2. Get Real Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // Show last 10 leads
      
      setLeads(leadsData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // 🔔 Realtime Subscription (Auto-Update on New Lead)
    const channel = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.new.user_id === user?.id) {
          setLeads((prev) => [payload.new, ...prev]);
          // Also update user counts
          fetchData(); 
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;
  if (!user) return <div className="p-8 text-center">Please log in.</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leads Counter */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-slate-500 mb-2 font-medium flex items-center gap-2">
            <LayoutDashboard size={18} /> Leads Today
          </div>
          <div className="text-4xl font-extrabold text-slate-800">
            {user.leads_today} <span className="text-lg text-slate-400 font-normal">/ {user.daily_limit}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((user.leads_today / user.daily_limit) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Plan Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-slate-500 mb-2 font-medium">Active Plan</div>
          <div className="flex items-center justify-between">
            <div className={`text-xl font-bold uppercase ${user.payment_status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
              {user.plan_name || 'Free Trial'}
            </div>
            {user.payment_status === 'active' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">ACTIVE</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Valid until: {user.valid_until ? new Date(user.valid_until).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        {/* Google Sheet Link */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-slate-500 mb-2 font-medium">Backup Sheet</div>
          {user.sheet_url ? (
            <a 
              href={user.sheet_url} 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-600 font-bold flex items-center gap-2 hover:underline"
            >
              Open Google Sheet <ExternalLink size={16}/>
            </a>
          ) : (
            <span className="text-slate-400 flex items-center gap-2">
              <AlertCircle size={16} /> Sheet creating...
            </span>
          )}
          <p className="text-xs text-slate-400 mt-2">Auto-syncs every 5 mins</p>
        </div>
      </div>

      {/* 📋 Recent Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-lg text-slate-800">Recent Leads</h2>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            Live Feed 🟢
          </span>
        </div>
        
        {leads.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p>No leads yet today. Relax, they are coming! 🚀</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Quality Score</th>
                  <th className="px-6 py-4">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {lead.name}
                    </td>
                    <td className="px-6 py-4">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                        <Phone size={14} /> {lead.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} /> {lead.city || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          (lead.quality_score || 50) >= 80 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : (lead.quality_score || 50) >= 60 
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {lead.quality_score || 50}/100
                        </span>
                        {(lead.quality_score || 50) >= 80 && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
