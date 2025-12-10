import React, { useEffect, useState } from 'react';
import { User, Lead } from '../types';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Real Data Fetching from Supabase
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id) // Sirf is user ki leads lao
          .order('created_at', { ascending: false }) // Newest pehle
          .limit(50); // Abhi ke liye top 50 dikhate hain

        if (error) throw error;

        // Data ko sahi format mein map karo
        if (data) {
           const mappedLeads: Lead[] = data.map((item: any) => ({
             id: item.id,
             name: item.name || 'Unknown',
             phone: item.phone || '',
             city: item.city || 'N/A',
             profession: '', // Agar script se nahi aa raha to blank
             age: 0,
             status: item.status || 'New',
           }));
           setLeads(mappedLeads);
        }
      } catch (err) {
        console.error("Error loading leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    // (Optional) Real-time subscription bhi laga sakte hain yahan
    // Taaki page refresh kiye bina nayi lead aa jaye
    const subscription = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` }, (payload) => {
          console.log('New lead arrived!', payload);
          // Nayi lead ko list mein upar add kar do
          const newLead = payload.new as any;
          setLeads(prev => [{
             id: newLead.id,
             name: newLead.name,
             phone: newLead.phone,
             city: newLead.city,
             profession: '',
             age: 0,
             status: 'New'
          }, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id]);

  const openWhatsApp = (phone: string, name: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const message = `Hi ${name}, I received your inquiry regarding our business plan. Are you available for a call?`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const openSheet = () => {
    if (user.sheet_url) {
      window.open(user.sheet_url, '_blank');
    } else {
      alert("Sheet not found. Please click 'Retry Connection'.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
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

      {/* Leads Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Recent Leads</h2>
          
          <button 
            onClick={openSheet}
            className="flex items-center space-x-2 text-sm text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-3 py-2 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{lead.phone}</td>
                  <td className="px-6 py-4">{lead.city}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openWhatsApp(lead.phone, lead.name)}
                      className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md"
                    >
                      <span>Chat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leads.length === 0 && !loading && (
            <div className="text-center p-8 text-slate-400">
              No leads yet. Waiting for new distribution...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
