import React, { useEffect, useState } from 'react';
import { User, Lead } from '../types';
import { supabase } from '../supabaseClient';
import { Lock, TrendingUp, Crown, MessageCircle, RefreshCw } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Locked Logic
  const isBasicUser = user.daily_limit <= 10 && user.daily_limit !== 5 && user.daily_limit !== 12 && user.daily_limit !== 20;

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50); // Fetch top 50

        if (error) throw error;
        if (data) setLeads(data);
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

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdating(leadId);
    try {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
        await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    } catch (err) {
        alert("Update failed. Check connection.");
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
    window.open(`https://wa.me/${cleanPhone}?text=Hi%20${name},%20saw%20your%20inquiry.`, '_blank');
  };

  const openSheet = () => {
    if (user.sheet_url) window.open(user.sheet_url, '_blank');
    else alert("Sheet not connected. Contact Admin.");
  };

  return (
    <div className="space-y-8 pb-32"> {/* HUGE BOTTOM PADDING FOR MOBILE */}
      
      {/* 1. RENEWAL BANNER */}
      {daysLeft <= 3 && daysLeft > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-900">Plan Expiring Soon</p>
              <p className="text-sm text-amber-800">{daysLeft} days left. Don't lose your leads.</p>
            </div>
          </div>
          <button onClick={() => window.location.href='/subscription'} className="w-full sm:w-auto bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700">Renew Now</button>
        </div>
      )}

      {/* 2. UPSELL BANNER (Visible & Clear) */}
      {isBasicUser && (
        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-500 p-3 rounded-full text-white">
                        <Crown className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">Unlock High Budget Leads</h3>
                        <p className="text-slate-300 text-sm">Upgrade to Supervisor Plan to verify client income.</p>
                    </div>
                </div>
                <button onClick={() => window.location.href='/subscription'} className="w-full md:w-auto bg-white text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors">
                    Upgrade ⚡
                </button>
             </div>
             {/* Decor */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 opacity-20 rounded-full blur-2xl -mr-10 -mt-10"></div>
        </div>
      )}

      {/* 3. STATS CARDS (SOLID COLORS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-brand-700 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-brand-200 text-xs font-bold uppercase">Total Leads</p>
          <div className="mt-2 text-4xl font-extrabold">{leads.length}</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-slate-400 text-xs font-bold uppercase">Daily Limit</p>
          <div className="mt-2 text-4xl font-extrabold text-brand-400">{user.daily_limit} <span className="text-sm text-white font-normal">/day</span></div>
        </div>
        <div className={`p-6 rounded-2xl text-white shadow-lg ${user.payment_status === 'active' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <p className="text-white/80 text-xs font-bold uppercase">Status</p>
          <div className="mt-2 text-3xl font-extrabold capitalize flex items-center gap-2">
            {user.payment_status}
            {user.payment_status === 'active' && <div className="h-3 w-3 bg-white rounded-full animate-pulse"></div>}
          </div>
        </div>
      </div>

      {/* 4. LEADS TABLE (SOLID UI - NO GLASS) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800 text-lg">Your Leads</h2>
          <button onClick={openSheet} className="text-brand-700 font-bold text-sm hover:underline">Open Sheet ↗</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900">{lead.name}</td>
                  <td className="px-6 py-5 font-mono">{lead.phone}</td>
                  <td className="px-6 py-5">{lead.city}</td>
                  
                  {/* SOLID WHITE DROPDOWN (Fix for blurry 3 dots) */}
                  <td className="px-6 py-5">
                    <div className="relative">
                      <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`
                          appearance-none w-40 px-4 py-2 rounded-lg font-bold border-2 cursor-pointer
                          ${lead.status === 'New' ? 'bg-white border-slate-300 text-slate-700' : ''}
                          ${lead.status === 'Interested' ? 'bg-white border-emerald-500 text-emerald-700' : ''}
                          ${lead.status === 'Rejected' ? 'bg-white border-red-400 text-red-600' : ''}
                          ${lead.status === 'Call Later' ? 'bg-white border-amber-400 text-amber-700' : ''}
                        `}
                      >
                        <option value="New">🔵 New</option>
                        <option value="Interested">✅ Interested</option>
                        <option value="Call Later">🕒 Call Later</option>
                        <option value="Rejected">❌ Rejected</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <button
                      onClick={() => openWhatsApp(lead.phone, lead.name)}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="p-10 text-center text-slate-400">
               No leads yet. Wait for daily distribution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
