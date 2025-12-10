import React, { useEffect, useState } from 'react';
import { User, Lead } from '../types';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Fake Leads for Demo (Jab tak real leads nahi aati)
  // Baad mein hum isse Supabase/Sheet se fetch karenge
  const demoLeads: Lead[] = [
    { id: '1', name: 'Rahul Sharma', phone: '919876543210', city: 'Mumbai', profession: 'Job', age: 28, status: 'New' },
    { id: '2', name: 'Priya Singh', phone: '918765432109', city: 'Pune', profession: 'Business', age: 34, status: 'New' },
  ];

  useEffect(() => {
    // Abhi ke liye demo leads dikha rahe hain
    // Real integration mein hum yahan Supabase se leads layenge
    setLeads(demoLeads);
    setLoading(false);
  }, []);

  const openWhatsApp = (phone: string, name: string) => {
    // 1. Phone number saaf karo (spaces, dashes hatao)
    let cleanPhone = phone.replace(/\D/g, '');
    
    // 2. Country code check (India default)
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    // 3. Pre-filled Message
    const message = `Hi ${name}, I received your inquiry regarding our business plan. Are you available for a call?`;
    
    // 4. Open WhatsApp Web/App
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
                  <td className="px-6 py-4">{lead.phone}</td>
                  <td className="px-6 py-4">{lead.city}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* 🔥 WhatsApp Click-to-Chat Button */}
                    <button
                      onClick={() => openWhatsApp(lead.phone, lead.name)}
                      className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.6 1.967.3 4.02 1.489 5.817z"/>
                      </svg>
                      <span>Chat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leads.length === 0 && !loading && (
            <div className="text-center p-8 text-slate-400">
              No leads found yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
