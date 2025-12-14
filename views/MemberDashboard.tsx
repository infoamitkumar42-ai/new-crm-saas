import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Lead } from '../types';
import { Phone, MapPin, RefreshCw, ExternalLink, FileSpreadsheet } from 'lucide-react';

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

      console.log("Fetching data for user:", user.id); // Debug Log

      // 1. Get My Profile & Sheet URL
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*') // Select ALL columns including sheet_url
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      setProfile(userData);

      // 2. Get Manager Name
      if (userData.manager_id) {
        const { data: managerData } = await supabase
            .from('users')
            .select('name')
            .eq('id', userData.manager_id)
            .single();
        setManagerName(managerData?.name || "Unknown");
      } else {
        setManagerName("No Manager (Direct)");
      }

      // 3. Get My Assigned Leads (All History)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false }); // Latest first

      if (leadsError) {
          console.error("Leads Fetch Error:", leadsError);
      } else {
          console.log("Leads Found:", leadsData); // Debug Log
          setLeads(leadsData || []);
      }

    } catch (error) {
      console.error("Dashboard Critical Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic Update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      alert("Error updating status!");
      fetchData(); // Revert
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Fresh': return 'bg-blue-100 text-blue-800';
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'Call Back': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-purple-100 text-purple-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Syncing your dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👋 Welcome, {profile?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reporting Manager: <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{managerName}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* 👇 Google Sheet Button (Only if URL exists) */}
            {(profile as any)?.sheet_url && (
                <a 
                  href={(profile as any).sheet_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm font-semibold text-sm"
                >
                  <FileSpreadsheet size={18} /> Open Sheet
                </a>
            )}
            
            <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-600">
                <RefreshCw size={20} />
            </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Assigned</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{leads.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Interested</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{leads.filter(l => l.status === 'Interested').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-yellow-500">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pending Calls</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{leads.filter(l => l.status === 'Fresh').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-purple-500">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Closed Deals</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{leads.filter(l => l.status === 'Closed').length}</p>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-lg">My Leads History</h2>
          <span className="text-xs text-slate-500 bg-white border px-2 py-1 rounded">
            Showing all {leads.length} records
          </span>
        </div>
        
        {leads.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="text-slate-400" size={24} />
            </div>
            <h3 className="text-slate-900 font-semibold mb-1">No leads found</h3>
            <p className="text-slate-500 text-sm">
                Your assigned leads will appear here automatically.<br/>
                Check if your manager has assigned any leads to you.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4 pl-6">Lead Name</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {lead.id.slice(0,6)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Phone size={14} className="text-blue-500" /> 
                        <a href={`tel:${lead.phone}`} className="hover:text-blue-600 hover:underline">{lead.phone}</a>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} className="text-slate-400" /> {lead.city || 'N/A'}
                      </div>
                    </td>
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
                    <td className="p-4 text-slate-500 text-xs">
                        {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-sm"
                      >
                         <option value="Fresh">Fresh</option>
                         <option value="Call Back">Call Back</option>
                         <option value="Interested">Interested</option>
                         <option value="Closed">Deal Closed</option>
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
