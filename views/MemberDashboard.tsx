import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Lead } from '../types';
import { Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare } from 'lucide-react'; 

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [managerName, setManagerName] = useState("Loading...");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get My Profile & Sheet URL
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(userData);

      // 2. Get Manager Name
      if (userData?.manager_id) {
        const { data: managerData } = await supabase
            .from('users')
            .select('name')
            .eq('id', userData.manager_id)
            .single();
        setManagerName(managerData?.name || "Unknown");
      } else {
        setManagerName("Direct (No Manager)");
      }

      // 3. Get My Assigned Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      setLeads(leadsData || []);

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic UI Update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
    
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      alert("Error updating status!");
      fetchData(); // Revert on error
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Fresh': return 'bg-blue-100 text-blue-800';
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-purple-100 text-purple-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };
  
  // 👇 WhatsApp Link Generator Function
  const getWhatsAppLink = (phone: string, name: string) => {
      // Message URL Encode karna zaruri hai
      const message = encodeURIComponent(`Hi ${name}, mera naam ${profile?.name} hai. Maine aapki lead dekhi thi. Kya aap free hain abhi baat karne ke liye?`);
      
      // Indian numbers ke liye 91 prefix zaruri hai
      const cleanPhone = phone.replace(/\D/g, ''); 
      const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      
      return `https://wa.me/${prefixedPhone}?text=${message}`;
  };


  if (loading) return <div className="p-10 text-center text-slate-500">Loading your workspace...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👋 Welcome, {profile?.name || 'Member'}</h1>
          <p className="text-sm text-slate-500">Manager: <span className="font-bold text-blue-600">{managerName}</span></p>
        </div>
        
        <div className="flex gap-3">
            {/* Google Sheet Button */}
            {(profile as any)?.sheet_url && (
                <a 
                  href={(profile as any).sheet_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm transition-all"
                >
                  <FileSpreadsheet size={18} /> Open Sheet
                </a>
            )}
            <button onClick={fetchData} className="p-2 bg-white border rounded-lg shadow-sm hover:bg-slate-50 text-slate-600 transition-all">
                <RefreshCw size={20} />
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Leads</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Interested</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{leads.filter(l => l.status === 'Interested').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-yellow-500">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{leads.filter(l => l.status === 'Fresh').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-purple-500">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Closed</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{leads.filter(l => l.status === 'Closed').length}</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">My Assigned Leads</h2>
          <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">Total: {leads.length}</span>
        </div>
        
        {leads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-medium">No leads assigned yet.</p>
            <p className="text-sm mt-1">Wait for your manager to send some! 🚀</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900">{lead.name}</td>
                    <td className="p-4 text-slate-600 flex items-center gap-2">
                      
                        {/* 1. PHONE CALL BUTTON */}
                      <a href={`tel:${lead.phone}`} className="hover:text-blue-600 flex items-center gap-1">
                            <Phone size={14} className="text-blue-500"/> 
                            {lead.phone}
                        </a>
                        
                        {/* 👇 2. WHATSAPP BUTTON (FINAL DESIGN) */}
                        <a 
                            href={getWhatsAppLink(lead.phone, lead.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            // 🟢 Green background, rounded circle, and shadow
                            className="ml-3 p-1.5 bg-green-600 rounded-full hover:bg-green-700 transition-colors shadow-md"
                            title={`Message ${lead.name} on WhatsApp`}
                        >
                            <MessageSquare size={16} className="text-white"/>
                        </a>
                    </td>
                    <td className="p-4 text-slate-600"><MapPin size={14} className="inline mr-1 text-slate-400"/> {lead.city || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                         lead.status === 'Fresh' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                         lead.status === 'Interested' ? 'bg-green-50 border-green-100 text-green-700' :
                         lead.status === 'Closed' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                         'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 cursor-pointer shadow-sm hover:border-blue-400 transition-colors"
                      >
                         <option value="Fresh">Fresh</option>
                         <option value="Call Back">Call Back</option>
                         <option value="Interested">Interested</option>
                         <option value="Closed">Closed</option>
                         <option value="Rejected">Rejected</option>
                      </select>
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
