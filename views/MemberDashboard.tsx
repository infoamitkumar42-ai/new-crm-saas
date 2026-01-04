import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare,
  X, Calendar, Target, TrendingUp, Clock,
  StickyNote, Check, LogOut, Zap, Crown, Lock,
  Gift, Flame, ArrowUp, Bell, Rocket, Shield,
  AlertCircle, Award, ChevronDown, Moon, Pause, Play,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Subscription } from '../components/Subscription';

// ============================================================
// TYPES
// ============================================================

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  plan_name: string;
  plan_weight: number;
  daily_limit: number;
  leads_today: number;
  valid_until: string;
  payment_status: string;
  manager_id: string;
  preferred_city: string;
  total_leads_received: number;
  sheet_url: string;
  filters: any;
  last_activity: string;
  is_active?: boolean;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: string;
  source: string;
  quality_score: number;
  distribution_score: number;
  notes: string;
  created_at: string;
  assigned_at: string;
}

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;

interface PerformanceStats {
  totalLeads: number;
  thisWeek: number;
  conversionRate: number;
}

interface DeliveryStatusInfo {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  statusType: 'active' | 'off_hours' | 'limit_reached' | 'paused' | 'inactive' | 'expired';
}

// ============================================================
// GLOBAL HELPER FUNCTIONS (Outside component to prevent ReferenceErrors)
// ============================================================

const getTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Fresh': return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'Contacted': return 'bg-cyan-50 border-cyan-200 text-cyan-700';
    case 'Call Back': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    case 'Interested': return 'bg-green-50 border-green-200 text-green-700';
    case 'Follow-up': return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'Closed': return 'bg-purple-50 border-purple-200 text-purple-700';
    case 'Rejected': return 'bg-red-50 border-red-200 text-red-700';
    case 'Invalid': return 'bg-black text-white border-slate-700';
    default: return 'bg-slate-50 border-slate-200 text-slate-700';
  }
};

const isWithinWorkingHours = () => {
  const hour = new Date().getHours();
  return hour >= 8 && hour < 22;
};

const getTimeUntilOpen = (): string => {
  const hour = new Date().getHours();
  if (hour >= 22) return `Opens in ${24 - hour + 8} hours`;
  if (hour < 8) return `Opens in ${8 - hour} hours`;
  return '';
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managerName, setManagerName] = useState('Direct');

  // Filters & Modals
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showNotesModal, setShowNotesModal] = useState<Lead | null>(null);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Computed Values
  const getDaysUntilExpiry = () => {
    if (!profile?.valid_until) return null;
    const expiry = new Date(profile.valid_until);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;
  const leadsToday = profile?.leads_today || 0;
  const dailyLimit = profile?.daily_limit || 0;
  const remainingToday = Math.max(0, dailyLimit - leadsToday);
  const dailyProgress = dailyLimit > 0 ? Math.min(100, Math.round((leadsToday / dailyLimit) * 100)) : 0;
  const isLimitReached = dailyLimit > 0 && leadsToday >= dailyLimit;
  const isPaused = profile?.is_active === false;

  const priorityBadge = useMemo(() => {
    const w = profile?.plan_weight || 1;
    if (w >= 9) return { text: 'ULTRA', color: 'bg-red-500 text-white', icon: Flame };
    if (w >= 7) return { text: 'TURBO', color: 'bg-orange-500 text-white', icon: Zap };
    if (w >= 5) return { text: 'PREMIUM', color: 'bg-purple-500 text-white', icon: Crown };
    if (w >= 3) return { text: 'HIGH', color: 'bg-blue-500 text-white', icon: ArrowUp };
    return { text: 'STANDARD', color: 'bg-slate-600 text-white', icon: Shield };
  }, [profile?.plan_weight]);

  const deliveryStatus: DeliveryStatusInfo = useMemo(() => {
    if (!profile) return { title: 'Loading...', subtitle: 'Fetching...', icon: Clock, iconBgColor: 'bg-white/20', iconColor: 'text-white', statusType: 'inactive' };

    if (profile.payment_status !== 'active' || isExpired) return { title: 'Plan Inactive', subtitle: 'Renew to receive leads', icon: AlertTriangle, iconBgColor: 'bg-red-500/30', iconColor: 'text-red-200', statusType: 'expired' };

    if (isPaused) return { title: 'Delivery Paused', subtitle: 'Resume to receive leads', icon: Pause, iconBgColor: 'bg-orange-500/30', iconColor: 'text-orange-200', statusType: 'paused' };

    if (!isWithinWorkingHours()) return { title: 'Off Hours', subtitle: 'Delivery: 8 AM - 10 PM', icon: Moon, iconBgColor: 'bg-white/20', iconColor: 'text-indigo-200', statusType: 'off_hours' };

    if (isLimitReached) return { title: 'Limit Reached', subtitle: `Received ${dailyLimit} leads today`, icon: CheckCircle2, iconBgColor: 'bg-green-500/30', iconColor: 'text-green-200', statusType: 'limit_reached' };

    return { title: 'Actively Receiving', subtitle: `${remainingToday} more leads today`, icon: Zap, iconBgColor: 'bg-green-500/30', iconColor: 'text-green-300', statusType: 'active' };
  }, [profile, isExpired, isPaused, isLimitReached, remainingToday, dailyLimit]);

  // Performance Stats
  const performanceStats: PerformanceStats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekly = leads.filter(l => new Date(l.created_at) > weekAgo).length;
    const closed = leads.filter(l => l.status === 'Closed').length;
    const conversion = leads.length > 0 ? Math.round((closed / leads.length) * 100) : 0;
    return { totalLeads: profile?.total_leads_received || leads.length, thisWeek: weekly, conversionRate: conversion };
  }, [leads, profile?.total_leads_received]);

  const stats = useMemo(() => ({
    total: leads.length, fresh: leads.filter(l => l.status === 'Fresh').length,
    interested: leads.filter(l => l.status === 'Interested').length,
    closed: leads.filter(l => l.status === 'Closed').length,
    callBack: leads.filter(l => l.status === 'Call Back').length,
  }), [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (dateFilter !== 'all') {
        const leadDate = new Date(lead.created_at);
        const today = new Date(new Date().setHours(0,0,0,0));
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (dateFilter === 'today' && leadDate < today) return false;
        if (dateFilter === 'week' && leadDate < weekAgo) return false;
      }
      return true;
    });
  }, [leads, statusFilter, dateFilter]);

  // Functions
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
      setProfile(userData);

      if (userData?.manager_id) {
        const { data: managerData } = await supabase.from('users').select('name').eq('id', userData.manager_id).maybeSingle();
        setManagerName(managerData?.name || 'Unknown');
      }

      const { data: leadsData } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l)));
    await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', leadId);
  };

  const handleReportInvalid = async (lead: Lead) => {
    const reason = window.prompt("Reason for invalid lead? (e.g. Wrong Number, Switched Off)");
    if (!reason) return;

    try {
      await supabase.from('lead_replacements').insert({ lead_id: lead.id, user_id: profile?.id, reason: reason });
      handleStatusChange(lead.id, 'Invalid');
      alert("Report submitted successfully.");
    } catch (err) { alert("Error submitting report"); }
  };

  const toggleDeliveryPause = async () => {
    if (!profile) return;
    const newStatus = !isPaused;
    setProfile(prev => prev ? { ...prev, is_active: !newStatus } : null);
    await supabase.from('users').update({ is_active: !newStatus }).eq('id', profile.id);
  };

  const saveNote = async () => {
    if (!showNotesModal) return;
    setSavingNote(true);
    try {
      await supabase.from('leads').update({ notes: noteText, updated_at: new Date().toISOString() }).eq('id', showNotesModal.id);
      setLeads(prev => prev.map(l => (l.id === showNotesModal.id ? { ...l, notes: noteText } : l)));
      setShowNotesModal(null);
      setNoteText('');
    } catch (err: any) { alert('Error: ' + err.message); } finally { setSavingNote(false); }
  };

  const getWhatsAppLink = (phone: string, leadName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${prefixedPhone}?text=${encodeURIComponent(`Hi ${leadName}, I'm ${profile?.name} from LeadFlow...`)}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-slate-500">Loading...</p></div></div>;

  const StatusIcon = deliveryStatus.icon;

  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${isExpired ? 'overflow-hidden' : ''}`}>
      {showSubscription && <Subscription onClose={() => setShowSubscription(false)} />}

      {/* Expiry Overlay */}
      {isExpired && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white text-center">
              <Lock size={32} className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Plan Expired!</h2>
            </div>
            <div className="p-6">
              <button onClick={() => setShowSubscription(true)} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"><RefreshCw size={20} /> Renew Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banners */}
      <div className="relative z-30">
        {!isWithinWorkingHours() && !isExpired && !bannerDismissed && (
          <div className="bg-amber-500 text-amber-950 py-2.5 px-4 flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm font-medium"><Moon size={16} /><span>⏰ Off Hours: Delivery starts at 8 AM</span></div>
            <button onClick={() => setBannerDismissed(true)}><X size={16} /></button>
          </div>
        )}
        {isLimitReached && !isExpired && (
          <div className="bg-emerald-600 text-white py-2.5 px-4 flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} /><span>🎯 Limit Reached. Upgrade for more!</span></div>
            <button onClick={() => setShowSubscription(true)} className="bg-white text-emerald-600 px-3 py-1 rounded-lg font-bold text-xs">Upgrade</button>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 truncate">👋 {profile?.name?.split(' ')[0]}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityBadge.color}`}>{priorityBadge.text}</span>
            </div>
            <div className="text-xs text-slate-500 truncate capitalize">{profile?.plan_name} • {managerName}</div>
          </div>
          <div className="flex gap-2">
            {profile?.sheet_url && <a href={profile.sheet_url} target="_blank" className="p-2 bg-green-600 text-white rounded-lg"><FileSpreadsheet size={18} /></a>}
            <button onClick={fetchData} className="p-2 bg-slate-100 rounded-lg"><RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /></button>
            <button onClick={() => supabase.auth.signOut()} className="p-2 bg-red-50 text-red-600 rounded-lg"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      {/* Main Stats Card (Always Premium Indigo) */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl p-6 mb-6 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${deliveryStatus.iconBgColor} backdrop-blur-sm`}>
                <StatusIcon size={28} className={deliveryStatus.iconColor} />
              </div>
              <div>
                <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Delivery Status</div>
                <div className="text-xl font-black">{deliveryStatus.title}</div>
                <div className="text-sm text-indigo-100">{deliveryStatus.subtitle}</div>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="flex-1 bg-white/10 rounded-xl p-3 text-center border border-white/10">
                <div className="text-xl font-black">{remainingToday}</div>
                <div className="text-[10px] uppercase">Remaining</div>
              </div>
              <button onClick={toggleDeliveryPause} className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isPaused ? 'bg-green-500/30' : 'bg-white/10'}`}>
                {isPaused ? <><Play size={16}/> Resume</> : <><Pause size={16}/> Pause</>}
              </button>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex justify-between text-xs mb-2"><span>Today's Progress</span><span>{leadsToday}/{dailyLimit}</span></div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500" style={{ width: `${dailyProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Scrollable Stats */}
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:grid sm:grid-cols-5 scrollbar-hide">
          <StatCard label="Total" value={performanceStats.totalLeads} color="slate" icon={<Target size={14} />} />
          <StatCard label="This Week" value={performanceStats.thisWeek} color="blue" icon={<Calendar size={14} />} />
          <StatCard label="Fresh" value={stats.fresh} color="green" icon={<Clock size={14} />} />
          <StatCard label="Closed" value={stats.closed} color="purple" icon={<Check size={14} />} />
          <StatCard label="Conv." value={`${performanceStats.conversionRate}%`} color="orange" icon={<Flame size={14} />} />
        </div>

        {/* Lead List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold">My Leads</h2>
            <span className="text-xs text-slate-500">{filteredLeads.length} items</span>
          </div>
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400"><Target size={40} className="mx-auto mb-2 opacity-20" />No leads found</div>
          ) : (
            <div className="divide-y">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12} /> {lead.city} • {getTimeAgo(lead.created_at)}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(lead.status)}`}>{lead.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-sm">Call</a>
                    <a href={getWhatsAppLink(lead.phone, lead.name)} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-bold text-sm">WhatsApp</a>
                    <button onClick={() => handleReportInvalid(lead)} className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></button>
                  </div>
                  <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value)} className="w-full mt-3 bg-white border border-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 appearance-none">
                    <option value="Fresh">🔵 Fresh</option>
                    <option value="Contacted">📞 Contacted</option>
                    <option value="Interested">✅ Interested</option>
                    <option value="Closed">🎉 Closed</option>
                    <option value="Rejected">❌ Rejected</option>
                    <option value="Invalid">🚫 Invalid</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Add Note</h3><button onClick={() => setShowNotesModal(null)}><X /></button></div>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full border rounded-xl p-4 h-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Notes..." />
            <button onClick={saveNote} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-4">Save Note</button>
          </div>
        </div>
      )}

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }: any) => {
  const colors: any = { slate: 'border-l-slate-400 bg-slate-50', blue: 'border-l-blue-500 bg-blue-50', green: 'border-l-green-500 bg-green-50', purple: 'border-l-purple-500 bg-purple-50', orange: 'border-l-orange-500 bg-orange-50' };
  return (
    <div className={`flex-shrink-0 w-[100px] sm:w-auto bg-white p-3 rounded-xl border-l-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1 text-slate-500 font-bold text-[10px] uppercase truncate">{icon} {label}</div>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
};

export default MemberDashboard;
