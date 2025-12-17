import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Lead } from '../types';
import { 
  Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare, 
  Filter, X, Calendar, Target, TrendingUp, Clock, 
  ChevronDown, StickyNote, Check, LogOut, LayoutDashboard
} from 'lucide-react';

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managerName, setManagerName] = useState("Loading...");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Notes Modal
  const [showNotesModal, setShowNotesModal] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get My Profile
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

      // 3. Get My Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLeads(leadsData || []);

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic UI Update
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, status: newStatus as any } : l
    ));
    
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      alert("Error updating status!");
      fetchData();
    }
  };

  const saveNote = async () => {
    if (!showNotesModal) return;
    setSavingNote(true);
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: noteText, updated_at: new Date().toISOString() })
        .eq('id', showNotesModal.id);

      if (error) throw error;
      
      // Update local state
      setLeads(prev => prev.map(l => 
        l.id === showNotesModal.id ? { ...l, notes: noteText } : l
      ));
      
      setShowNotesModal(null);
      setNoteText('');
      
    } catch (err: any) {
      alert("Error saving note: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const getWhatsAppLink = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `Hi ${name}, I'm ${profile?.name} from LeadFlow. I saw your inquiry and wanted to connect. Are you available to discuss?`
    );
    const cleanPhone = phone.replace(/\D/g, '');
    const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${prefixedPhone}?text=${message}`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Fresh': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Contacted': return 'bg-cyan-50 border-cyan-200 text-cyan-700';
      case 'Call Back': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'Interested': return 'bg-green-50 border-green-200 text-green-700';
      case 'Follow-up': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Closed': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'Rejected': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    // Status filter
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    
    // Date filter
    if (dateFilter !== 'all') {
      const leadDate = new Date(lead.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (dateFilter === 'today' && leadDate < today) return false;
      if (dateFilter === 'week' && leadDate < weekAgo) return false;
    }
    
    return true;
  });

  // Stats
  const stats = {
    total: leads.length,
    fresh: leads.filter(l => l.status === 'Fresh').length,
    interested: leads.filter(l => l.status === 'Interested').length,
    closed: leads.filter(l => l.status === 'Closed').length,
  };

  // Daily progress
  const dailyProgress = profile?.daily_limit 
    ? Math.min(100, Math.round(((profile as any).leads_today / profile.daily_limit) * 100))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                👋 Welcome, {profile?.name || 'Member'}
              </h1>
              <p className="text-sm text-slate-500">
                Manager: <span className="font-medium text-blue-600">{managerName}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {(profile as any)?.sheet_url && (
                <a 
                  href={(profile as any).sheet_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-all"
                >
                  <FileSpreadsheet size={16} />
                  <span className="hidden sm:inline">Open Sheet</span>
                </a>
              )}
              
              <button 
                onClick={fetchData}
                disabled={refreshing}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                <RefreshCw size={18} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Daily Progress */}
        {profile?.daily_limit > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 mb-6 text-white">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Target size={18} />
                <span className="font-medium">Today's Progress</span>
              </div>
              <span className="font-bold">
                {(profile as any).leads_today || 0} / {profile.daily_limit} leads
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div 
                className="bg-white rounded-full h-2.5 transition-all duration-500"
                style={{ width: `${dailyProgress}%` }}
              ></div>
            </div>
            {dailyProgress >= 100 && (
              <p className="text-sm text-blue-100 mt-2">
                🎉 Daily limit reached! New leads will come tomorrow.
              </p>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Leads" value={stats.total} color="slate" icon={<Target size={18} />} />
          <StatCard label="Fresh" value={stats.fresh} color="blue" icon={<Clock size={18} />} />
          <StatCard label="Interested" value={stats.interested} color="green" icon={<TrendingUp size={18} />} />
          <StatCard label="Closed" value={stats.closed} color="purple" icon={<Check size={18} />} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <div className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="Fresh">🔵 Fresh</option>
                <option value="Call Back">🟡 Call Back</option>
                <option value="Interested">🟢 Interested</option>
                <option value="Follow-up">🟠 Follow-up</option>
                <option value="Closed">🟣 Closed</option>
                <option value="Rejected">🔴 Rejected</option>
              </select>
            </div>
            
            {/* Date Filter */}
            <div className="flex-1">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">📅 Today</option>
                <option value="week">📆 Last 7 Days</option>
              </select>
            </div>
            
            {/* Clear Filters */}
            {(statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}
                className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
              >
                <X size={16} /> Clear
              </button>
            )}
          </div>
          
          {/* Active Filter Tags */}
          {(statusFilter !== 'all' || dateFilter !== 'all') && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">Showing:</span>
              {statusFilter !== 'all' && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {statusFilter}
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {dateFilter === 'today' ? 'Today' : 'Last 7 days'}
                </span>
              )}
              <span className="text-xs text-slate-500">
                ({filteredLeads.length} leads)
              </span>
            </div>
          )}
        </div>

        {/* Leads Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">My Leads</h2>
            <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">
              {filteredLeads.length} of {leads.length}
            </span>
          </div>
          
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-slate-400" />
              </div>
              <p className="font-medium text-slate-800">No leads found</p>
              <p className="text-sm text-slate-500 mt-1">
                {leads.length === 0 
                  ? "Wait for leads to be assigned to you! 🚀" 
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs">
                    <tr>
                      <th className="p-4 pl-6">Lead</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">City</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Time</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900">{lead.name}</div>
                          {lead.notes && (
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <StickyNote size={10} /> {lead.notes.slice(0, 30)}...
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${lead.phone}`} 
                              className="flex items-center gap-1 text-slate-600 hover:text-blue-600"
                            >
                              <Phone size={14} className="text-blue-500" />
                              {lead.phone}
                            </a>
                            <a 
                              href={getWhatsAppLink(lead.phone, lead.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
                            >
                              <MessageSquare size={12} className="text-white" />
                            </a>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin size={14} className="text-slate-400" />
                            {lead.city || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-slate-500">
                            {getTimeAgo(lead.created_at)}
                          </span>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setShowNotesModal(lead);
                                setNoteText(lead.notes || '');
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Add Note"
                            >
                              <StickyNote size={16} />
                            </button>
                            <select 
                              value={lead.status}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 cursor-pointer"
                            >
                              <option value="Fresh">Fresh</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Call Back">Call Back</option>
                              <option value="Interested">Interested</option>
                              <option value="Follow-up">Follow-up</option>
                              <option value="Closed">Closed</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {lead.city || 'N/A'}
                          <span className="mx-1">•</span>
                          <Clock size={10} /> {getTimeAgo(lead.created_at)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    
                    {/* Notes */}
                    {lead.notes && (
                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mb-3 flex items-start gap-1">
                        <StickyNote size={12} className="mt-0.5 shrink-0" />
                        <span>{lead.notes}</span>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <a 
                        href={`tel:${lead.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-lg font-medium text-sm"
                      >
                        <Phone size={16} /> Call
                      </a>
                      <a 
                        href={getWhatsAppLink(lead.phone, lead.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-lg font-medium text-sm"
                      >
                        <MessageSquare size={16} /> WhatsApp
                      </a>
                      <button
                        onClick={() => {
                          setShowNotesModal(lead);
                          setNoteText(lead.notes || '');
                        }}
                        className="p-2.5 bg-slate-100 text-slate-600 rounded-lg"
                      >
                        <StickyNote size={16} />
                      </button>
                    </div>
                    
                    {/* Status Change */}
                    <div className="mt-3">
                      <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500"
                      >
                        <option value="Fresh">🔵 Fresh</option>
                        <option value="Contacted">📞 Contacted</option>
                        <option value="Call Back">🔄 Call Back</option>
                        <option value="Interested">✅ Interested</option>
                        <option value="Follow-up">📅 Follow-up</option>
                        <option value="Closed">🎉 Closed</option>
                        <option value="Rejected">❌ Rejected</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">Add Note</h3>
                <button 
                  onClick={() => setShowNotesModal(null)} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {showNotesModal.name} • {showNotesModal.phone}
              </p>
            </div>
            
            <div className="p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes about this lead..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none h-32"
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={savingNote}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {savingNote ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} /> Save Note
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => {
  const colors: Record<string, string> = {
    slate: 'border-l-slate-400',
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
  };

  const iconColors: Record<string, string> = {
    slate: 'text-slate-600 bg-slate-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 border-l-4 ${colors[color]}`}>
      <div className={`inline-flex p-2 rounded-lg ${iconColors[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
};

export default MemberDashboard;
