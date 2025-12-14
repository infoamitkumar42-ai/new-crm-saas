import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Lead } from '../types';
import { Phone, MapPin, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';

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

      // 1. Get My Profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      setProfile(userData);

      // 2. Get Manager Name (if exists)
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

      // 3. Get My Assigned Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id) // 🔒 Security: Only my leads
        .order('created_at', { ascending: false });

      if (leadsError) console.error("Error fetching leads:", leadsError);
      setLeads(leadsData || []);

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Update Status Function
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic UI Update (Turant change dikhana)
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

  // Color Helper
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

  if (loading) return <div className="p-10 text-center text-slate-500">Loading your leads...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">👋 Welcome, {profile?.name}</h1>
          <p className="text-sm text-slate-500">Team Manager: <span className="font-bold text-blue-600">{managerName}</span></p>
        </div>
        <div className="text-right">
           <button onClick={fetchData} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all">
             <RefreshCw size={20} className="text-slate-600" />
           </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold">Total Leads</p>
          <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold">Interested</p>
          <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'Interested').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{leads.filter(l => l.status === 'Fresh').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold">Closed</p>
          <p className="text-2xl font-bold text-purple-600">{leads.filter(l => l.status === 'Closed').length}</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Your Assigned Leads</h2>
        </div>
        
        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-2">No leads assigned yet.</p>
            <p className="text-sm text-slate-500">Wait for your manager to send some! 🚀</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{lead.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} /> {lead.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} /> {lead.city || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
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
