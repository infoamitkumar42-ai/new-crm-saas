import React, { useEffect, useState } from 'react';
import { User, Lead } from '../types';
import { supabase } from '../supabaseClient';
import { Lock, TrendingUp, Crown, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // --- UPSELL LOGIC ---
  const isBasicUser = user.daily_limit <= 10 && user.daily_limit !== 5 && user.daily_limit !== 12 && user.daily_limit !== 20;

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        if (data) setLeads(data); // Direct mapping if names match, else map manually like before
      } catch (err) {
        console.error("Error loading leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    // Real-time listener
    const subscription = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` }, (payload) => {
          setLeads(prev => [payload.new as Lead, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id]);

  // --- 🔄 STATUS UPDATE LOGIC ---
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdating(leadId);
    try {
        // 1. Optimistic Update (Turant UI change karo)
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));

        // 2. DB Update
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', leadId);

        if (error) throw error;
    } catch (err) {
        alert("Failed to update status");
        // Revert on error could be added here
    } finally {
        setUpdating(null);
    }
  };

  const calculateDaysLeft = (validUntil: string | null) => {
    if (!validUntil) return 0;
    const today = new Date();
    const expiry = new Date(validUntil);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const daysLeft = calculateDaysLeft(user.valid_until);

  const openWhatsApp = (phone: string, name: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const message = `Hi ${name}, I received your inquiry. Are you available for a call?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openSheet = () => {
    if (user.sheet_url) window.open(user.sheet_url, '_blank');
    else alert("Sheet not connected.");
  };

  // Status Badge Colors
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Interested': return 'bg-green-100 text-green-700 border-green-200';
          case 'Call Later': return 'bg-amber-100 text-amber-700 border-amber-200';
          case 'Rejected': return 'bg-red-50 text-red-600 border-red-100';
          default: return 'bg-slate-100 text-slate-600 border-slate-200'; // New
      }
  };

  return (
    <div className="space-y-6">
      
      {/* RENEWAL BANNER */}
      {daysLeft <= 3 && daysLeft > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex justify-between items-center shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800">Plan Expiring Soon!</p>
              <p className="text-sm text-amber-700">Only {daysLeft} days left. Recharge to keep leads flowing.</p>
            </div>
          </div>
          <a href="/subscription" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 shadow">Renew Now</a>
        </div>
      )}

      {/* UPSELL BANNER */}
      {isBasicUser && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-1 shadow-lg">
          <div className="bg-white rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                   <Crown className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-slate-900">Unlock "High Budget" Leads?</h3>
                   <p className="text-sm text-slate-500">Upgrade to <span className="font-bold text-indigo-600">Supervisor Plan</span> to see lead income & budget.</p>
                </div>
             </div>
             <button onClick={() => window.location.href='/subscription'} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-md">
                Upgrade Plan ⚡
             </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Total Leads</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{leads.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Daily Limit</div>
          <div className="text-3xl font-bold text-brand-600 mt-2">{user.daily_limit}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Plan Status</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2 capitalize">{user.payment_status}</div>
        </div>
      </div>

      {/* LEADS TABLE (INTERACTIVE) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Your Leads</h2>
          <button onClick={openSheet} className="flex items-center space-x-2 text-sm text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-3 py-2 rounded-lg">
            <span>Open Google Sheet</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Status (Click to Change)</th>
                <th className="px-6 py-4">
                    <div className="flex items-center gap-1">Budget {isBasicUser && <Lock className="w-3 h-3 text-slate-400" />}</div>
                </th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{lead.phone}</td>
                  <td className="px-6 py-4">{lead.city}</td>
                  
                  {/* 🟢 INTERACTIVE STATUS DROPDOWN */}
                  <td className="px-6 py-4">
                    <div className="relative">
                        <select 
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            disabled={updating === lead.id}
                            className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer focus:ring-2 focus:ring-brand-500 transition-all ${getStatusColor(lead.status)}`}
                        >
                            <option value="New">New Lead</option>
                            <option value="Interested">Interested ✅</option>
                            <option value="Call Later">Call Later 🕒</option>
                            <option value="Rejected">Not Interested ❌</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                  </td>

                  {/* 🔒 Locked Column */}
                  <td className="px-6 py-4">
                    {isBasicUser ? (
                        <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-2 py-1 rounded w-fit text-xs font-bold select-none">
                            <Lock className="w-3 h-3" />
                            <span>Upgrade</span>
                        </div>
                    ) : (
                        <div className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>₹ High</span>
                        </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => openWhatsApp(lead.phone, lead.name)}
                      className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leads.length === 0 && !loading && (
            <div className="text-center p-8 text-slate-400">No leads yet. They will appear here daily.</div>
          )}
        </div>
      </div>
    </div>
  );
};
