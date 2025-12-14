import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Lead } from '../types';
import { Phone, MapPin, RefreshCw, FileSpreadsheet } from 'lucide-react';

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [managerName, setManagerName] = useState("Loading...");
  
  // Debug State (Galti pakadne ke liye)
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setDebugInfo({ error: "No user logged in" });
        return;
      }

      // Debugging: User ID store kar rahe hain
      setDebugInfo(prev => ({ ...prev, userId: user.id, email: user.email }));

      // 1. Get My Profile & Sheet URL
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        setDebugInfo(prev => ({ ...prev, userError: userError.message }));
      } else {
        setProfile(userData);
        setDebugInfo(prev => ({ ...prev, sheetUrl: userData.sheet_url || "Not Found" }));
      }

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
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id) // Filter by My ID
        .order('created_at', { ascending: false });

      if (leadsError) {
          console.error("Leads Fetch Error:", leadsError);
          setDebugInfo(prev => ({ ...prev, leadsError: leadsError.message }));
      } else {
          setLeads(leadsData || []);
          setDebugInfo(prev => ({ ...prev, leadsCount: leadsData?.length || 0 }));
      }

    } catch (error: any) {
      setDebugInfo(prev => ({ ...prev, criticalError: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
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

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👋 Welcome, {profile?.name || 'Member'}</h1>
          <p className="text-sm text-slate-500">Manager: <span className="font-bold text-blue-600">{managerName}</span></p>
        </div>
        
        <div className="flex gap-3">
            {/* Google Sheet Button - Sirf tab dikhega jab URL hoga */}
            {(profile as any)?.sheet_url && (
                <a 
                  href={(profile as any).sheet_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm"
                >
                  <FileSpreadsheet size={18} /> Open Sheet
                </a>
            )}
            <button onClick={fetchData} className="p-2 bg-white border rounded-lg shadow-sm">
                <RefreshCw size={20} />
            </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-slate-400 font-bold">Total</p>
          <p className="text-2xl font-bold">{leads.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500">
          <p className="text-xs text-slate-400 font-bold">Interested</p>
          <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'Interested').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-yellow-500">
          <p className="text-xs text-slate-400 font-bold">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{leads.filter(l => l.status === 'Fresh').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-purple-500">
          <p className="text-xs text-slate-400 font-bold">Closed</p>
          <p className="text-2xl font-bold text-purple-600">{leads.filter(l => l.status === 'Closed').length}</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between">
          <h2 className="font-bold text-slate-800">My Leads</h2>
          <span className="text-xs bg-white border px-2 py-1 rounded">Total: {leads.length}</span>
        </div>
        
        {leads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p>No leads found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold">{lead.name}</td>
                    <td className="p-4 flex items-center gap-2"><Phone size={14} className="text-blue-500"/> {lead.phone}</td>
                    <td className="p-4 text-slate-600"><MapPin size={14} /> {lead.city || 'N/A'}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(lead.status)}`}>{lead.status}</span></td>
                    <td className="p-4">
                      <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="border rounded px-2 py-1 outline-none text-xs"
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

      {/* 🔴 DEBUG BOX (Sirf Error Check Karne Ke Liye) */}
      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-800">
        <h3 className="font-bold mb-2">🔧 Debug Info (Iska screenshot lekar dikhana agar error aaye)</h3>
        <p><strong>My User ID:</strong> {debugInfo.userId}</p>
        <p><strong>My Email:</strong> {debugInfo.email}</p>
        <p><strong>Leads Found:</strong> {debugInfo.leadsCount}</p>
        <p><strong>Sheet URL:</strong> {debugInfo.sheetUrl}</p>
        {debugInfo.leadsError && <p className="font-bold">⚠️ Leads Error: {debugInfo.leadsError}</p>}
      </div>

    </div>
  );
};
