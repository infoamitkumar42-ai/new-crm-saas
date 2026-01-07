/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - MemberDashboard.tsx v3.3 (HOTFIX)             ║
 * ║  Updated: January 8, 2026                                  ║
 * ║  Fix: Added missing 'User' import                          ║
 * ║                                                            ║
 * ║  ⚠️  STATUS: 100% WORKING                                  ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare,
  X, Calendar, Target, Clock,
  StickyNote, Check, LogOut, Zap, Crown, Lock,
  Flame, ArrowUp, Bell, Shield,
  AlertCircle, Award, ChevronDown, Moon, Pause, Play,
  CheckCircle2, AlertTriangle, Flag, Gift, Lightbulb, Users, User // ✅ Fixed: Added 'User'
} from 'lucide-react';
import { Subscription } from '../components/Subscription';
import { TargetAudience } from '../components/TargetAudience';
import { useAuth } from '../auth/useAuth';

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
  days_extended?: number;
  total_leads_promised?: number;
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

interface DeliveryStatusInfo {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  statusType: 'active' | 'off_hours' | 'limit_reached' | 'paused' | 'inactive' | 'expired';
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatLeadTime = (timestamp: string): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  } catch {
    return '';
  }
};

const isToday = (timestamp: string): boolean => {
  const date = new Date(timestamp);
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Fresh': return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'Contacted': return 'bg-cyan-50 border-cyan-200 text-cyan-700';
    case 'Call Back': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    case 'Interested': return 'bg-green-50 border-green-200 text-green-700';
    case 'Closed': return 'bg-purple-50 border-purple-200 text-purple-700';
    case 'Rejected': return 'bg-red-50 border-red-200 text-red-700';
    case 'Invalid': return 'bg-gray-50 border-gray-300 text-gray-600';
    default: return 'bg-slate-50 border-slate-200 text-slate-700';
  }
};

const isWithinWorkingHours = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 8 && hour < 22;
};

const getTimeUntilOpen = (): string => {
  const hour = new Date().getHours();
  if (hour >= 22) {
    return `Opens in ${24 - hour + 8} hours`;
  } else if (hour < 8) {
    return `Opens in ${8 - hour} hours`;
  }
  return '';
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================

const StatCard = ({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) => {
  const colors: Record<string, string> = {
    slate: 'border-l-slate-400 bg-slate-50/50', blue: 'border-l-blue-500 bg-blue-50/50',
    green: 'border-l-green-500 bg-green-50/50', purple: 'border-l-purple-500 bg-purple-50/50',
    orange: 'border-l-orange-500 bg-orange-50/50'
  };
  const iconColors: Record<string, string> = {
    slate: 'text-slate-600', blue: 'text-blue-600', green: 'text-green-600',
    purple: 'text-purple-600', orange: 'text-orange-600'
  };
  return (
    <div className={`flex-shrink-0 w-[100px] sm:w-auto bg-white p-3 rounded-xl shadow-sm border border-slate-100 border-l-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1"><span className={iconColors[color]}>{icon}</span><span className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase truncate">{label}</span></div>
      <p className="text-lg sm:text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export const MemberDashboard = () => {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managerName, setManagerName] = useState('Loading...');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Modals
  const [showNotesModal, setShowNotesModal] = useState<Lead | null>(null);
  const [showReportModal, setShowReportModal] = useState<Lead | null>(null);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showTargetAudience, setShowTargetAudience] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingLead, setReportingLead] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const getWhatsAppLink = (phone: string, leadName: string, userName: string): string => {
    const safeName = leadName || 'there';
    const safeUserName = userName || 'LeadFlow';
    const message = encodeURIComponent(`Hi ${safeName}, I'm ${safeUserName} from LeadFlow. I saw your inquiry and wanted to connect. Are you available to discuss?`);
    const cleanPhone = phone.replace(/\D/g, '');
    const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${prefixedPhone}?text=${message}`;
  };

  const getDaysUntilExpiry = () => {
    if (!profile?.valid_until) return null;
    return Math.ceil((new Date(profile.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const leadsToday = profile?.leads_today || 0;
  const dailyLimit = profile?.daily_limit || 0;
  const remainingToday = Math.max(0, dailyLimit - leadsToday);
  const dailyProgress = dailyLimit > 0 ? Math.min(100, Math.round((leadsToday / dailyLimit) * 100)) : 0;
  const isLimitReached = dailyLimit > 0 && leadsToday >= dailyLimit;
  const isPaused = profile?.is_active === false;
  const daysExtended = profile?.days_extended || 0;
  const totalReceived = profile?.total_leads_received || 0;

  const priorityBadge = useMemo(() => {
    const w = profile?.plan_weight || 1;
    if (w >= 50) return { text: 'MANAGER', color: 'bg-red-600 text-white', icon: Crown as LucideIcon };
    if (w >= 40) return { text: 'VIP BOOST', color: 'bg-purple-600 text-white', icon: Flame as LucideIcon };
    if (w >= 30) return { text: 'SUPERVISOR', color: 'bg-blue-600 text-white', icon: Shield as LucideIcon };
    return { text: 'STARTER', color: 'bg-slate-600 text-white', icon: User as LucideIcon }; // ✅ Now 'User' is defined
  }, [profile?.plan_weight]);

  const deliveryStatus: DeliveryStatusInfo = useMemo(() => {
    if (!profile) return { title: 'Loading...', subtitle: 'Fetching status', icon: Clock, iconBgColor: 'bg-white/20', iconColor: 'text-white', statusType: 'inactive' };
    if (profile.payment_status !== 'active' || isExpired) return { title: 'Plan Inactive', subtitle: 'Renew to receive leads', icon: AlertTriangle, iconBgColor: 'bg-red-500/30', iconColor: 'text-red-200', statusType: 'expired' };
    if (isPaused) return { title: 'Delivery Paused', subtitle: 'Resume to receive leads', icon: Pause, iconBgColor: 'bg-orange-500/30', iconColor: 'text-orange-200', statusType: 'paused' };
    if (!isWithinWorkingHours()) return { title: 'Off Hours', subtitle: 'Delivery: 8 AM - 10 PM', icon: Moon, iconBgColor: 'bg-white/20', iconColor: 'text-indigo-200', statusType: 'off_hours' };
    if (isLimitReached) return { title: 'Daily Limit Reached', subtitle: `Received ${dailyLimit} leads today`, icon: CheckCircle2, iconBgColor: 'bg-green-500/30', iconColor: 'text-green-200', statusType: 'limit_reached' };
    return { title: 'Actively Receiving', subtitle: `${remainingToday} more leads today`, icon: Zap, iconBgColor: 'bg-green-500/30', iconColor: 'text-green-300', statusType: 'active' };
  }, [profile, isExpired, isPaused, isLimitReached, remainingToday, dailyLimit]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (dateFilter !== 'all') {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today' && leadDate < today) return false;
        if (dateFilter === 'week' && leadDate < new Date(today.getTime() - 7 * 86400000)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, dateFilter]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); setRefreshing(false); return; }

      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (userData) {
        setProfile(userData);
        await supabase.from('users').update({ last_activity: new Date().toISOString() }).eq('id', user.id);
        const { data: manager } = await supabase.from('users').select('name').eq('id', userData.manager_id).maybeSingle();
        setManagerName(manager?.name || 'Direct (No Manager)');
      }
      const { data: leadsData } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setLeads(leadsData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    if (window.location.search.includes('payment_success=true')) {
      setLoading(true);
      refreshProfile?.().then(() => fetchData().then(() => window.history.replaceState({}, '', '/')));
    } else { fetchData(); }
  }, [refreshProfile]);

  useEffect(() => {
    if (!profile?.id || isPaused) return;
    const channel = supabase.channel(`member-leads-${profile.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `user_id=eq.${profile.id}` }, (payload) => {
      setLeads(prev => [payload.new as Lead, ...prev]);
      if ('Notification' in window && Notification.permission === 'granted') new Notification('🔥 New Lead!', { body: `${payload.new.name}`, icon: '/logo.png' });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, isPaused]);

  const toggleDeliveryPause = async () => {
    if (!profile) return;
    try {
      await supabase.from('users').update({ is_active: !profile.is_active, updated_at: new Date().toISOString() }).eq('id', profile.id);
      await fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const saveNote = async () => {
    if (!showNotesModal) return;
    setSavingNote(true);
    await supabase.from('leads').update({ notes: noteText, updated_at: new Date().toISOString() }).eq('id', showNotesModal.id);
    setLeads(prev => prev.map(l => l.id === showNotesModal.id ? { ...l, notes: noteText } : l));
    setSavingNote(false); setShowNotesModal(null);
  };

  const handleReportInvalidLead = async () => {
    if (!showReportModal || !reportReason) return;
    setReportingLead(true);
    await supabase.from('lead_replacements').insert({ user_id: profile?.id, original_lead_id: showReportModal.id, reason: reportReason, status: 'pending' });
    await supabase.from('leads').update({ status: 'Invalid', notes: `${showReportModal.notes}\n[Reported: ${reportReason}]` }).eq('id', showReportModal.id);
    setLeads(prev => prev.map(l => l.id === showReportModal.id ? { ...l, status: 'Invalid' } : l));
    setReportingLead(false); setShowReportModal(null); alert('✅ Reported!');
  };

  const StatusIcon = deliveryStatus.icon;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!profile) return <div className="p-8 text-center"><AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" /><h2>Profile Not Found</h2><button onClick={() => supabase.auth.signOut()} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">Retry</button></div>;

  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${isExpired ? 'overflow-hidden' : ''}`}>
      {showSubscription && <Subscription onClose={() => setShowSubscription(false)} />}
      {showTargetAudience && <TargetAudience onClose={() => setShowTargetAudience(false)} />}
      
      {isExpired && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl p-6 text-center"><h2 className="text-2xl font-bold text-red-600 mb-2">Plan Expired!</h2><button onClick={() => setShowSubscription(true)} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">Renew Now</button></div></div>}

      <div className="relative z-30">
        {isPaused && !isExpired && <div className="bg-orange-500 text-white py-2 px-4 flex justify-between items-center text-sm font-medium"><span>⏸️ Delivery Paused</span><button onClick={toggleDeliveryPause} className="bg-white text-orange-600 px-3 py-1 rounded-lg text-xs font-bold flex gap-1"><Play size={12} /> Resume</button></div>}
        {!isWithinWorkingHours() && !isExpired && !isPaused && !bannerDismissed && <div className="bg-amber-500 text-amber-950 py-2 px-4 flex justify-between items-center text-sm"><span>⏰ Off Hours ({getTimeUntilOpen()})</span><button onClick={() => setBannerDismissed(true)}><X size={16}/></button></div>}
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">👋 {profile.name?.split(' ')[0]}</h1><span className={`hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${priorityBadge.color}`}>{priorityBadge.text}</span></div>
            <div className="text-xs text-slate-500 truncate"><span className="text-green-600 font-medium capitalize">{profile.plan_name}</span> • {managerName}</div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => setShowTargetAudience(true)} className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"><Users size={18} /><span className="hidden sm:inline ml-1.5 text-sm font-medium">Audience</span></button>
            {profile.sheet_url && <a href={profile.sheet_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><FileSpreadsheet size={18} /><span className="hidden sm:inline ml-1.5 text-sm font-medium">Sheet</span></a>}
            <button onClick={fetchData} disabled={refreshing} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center"><RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /></button>
            <button onClick={() => supabase.auth.signOut()} className="w-9 h-9 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center justify-center"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24">
        {/* Status Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl p-4 sm:p-6 mb-4 shadow-xl">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4"><div className={`p-3 rounded-xl ${deliveryStatus.iconBgColor}`}><StatusIcon size={24} className={deliveryStatus.iconColor} /></div><div><div className="text-[10px] uppercase font-bold text-indigo-200">Status</div><div className="text-lg font-black">{deliveryStatus.title}</div><div className="text-xs text-indigo-200">{deliveryStatus.subtitle}</div></div></div>
            <div className="text-center bg-white/15 rounded-xl px-4 py-2"><div className="text-xl font-black">{remainingToday}</div><div className="text-[10px] text-indigo-200">Left</div></div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20"><div className="flex justify-between text-xs mb-1"><span className="text-indigo-200">Progress</span><span className="font-bold">{leadsToday}/{dailyLimit}</span></div><div className="w-full bg-white/20 rounded-full h-2.5"><div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{ width: `${dailyProgress}%` }} /></div></div>
          {daysExtended > 0 && <div className="mt-3 flex items-center gap-2 text-xs text-green-200 bg-green-500/20 px-3 py-2 rounded-lg"><Gift size={14} /> Plan extended by {daysExtended} days</div>}
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <StatCard label="Total" value={totalReceived} color="slate" icon={<Target size={14} />} />
          <StatCard label="Fresh" value={leads.filter(l => l.status === 'Fresh').length} color="green" icon={<Clock size={14} />} />
          <StatCard label="Closed" value={leads.filter(l => l.status === 'Closed').length} color="purple" icon={<Check size={14} />} />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 p-2.5 border rounded-xl text-sm bg-white"><option value="all">All Status</option><option value="Fresh">🔵 Fresh</option><option value="Interested">✅ Interested</option><option value="Closed">🎉 Closed</option></select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="flex-1 p-2.5 border rounded-xl text-sm bg-white"><option value="all">All Time</option><option value="today">Today</option></select>
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between"><h2 className="font-bold text-slate-800 text-sm">My Leads</h2><span className="text-xs bg-white px-2 py-1 rounded border">{filteredLeads.length}</span></div>
          {filteredLeads.length === 0 ? <div className="p-12 text-center text-slate-400"><Target size={32} className="mx-auto mb-2" /><p>No leads found</p></div> : 
            <div className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isNight = lead.source === 'Night_Backlog' || lead.source === 'Night_Queue';
                return (
                  <div key={lead.id} className="p-4 hover:bg-slate-50 transition">
                    <div className="flex justify-between mb-2">
                      <div><div className="font-bold text-slate-900">{lead.name}</div><div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {lead.city || 'N/A'}</div></div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 ${isNight ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}>
                        {isNight ? <Moon size={10} /> : <Clock size={10} />}
                        {formatLeadTime(lead.created_at)}
                      </div>
                    </div>
                    
                    {/* 🌙 Night Tip UI */}
                    {isNight && <div className="mb-3 bg-blue-50 border border-blue-100 rounded-lg p-2 flex gap-2"><Lightbulb size={16} className="text-blue-500" /><div><p className="text-xs text-blue-800 font-bold">Pro Tip: Night Lead!</p><p className="text-[10px] text-blue-600">Call pick chance low? WhatsApp first! 🚀</p></div></div>}
                    
                    {lead.notes && <div className="text-xs bg-amber-50 p-2 rounded mb-3 text-slate-600 border-amber-100 border">{lead.notes}</div>}
                    
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <a href={`tel:${lead.phone}`} className="col-span-1 flex flex-col items-center justify-center bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold"><Phone size={14} /> Call</a>
                      <a href={getWhatsAppLink(lead.phone, lead.name, profile.name)} target="_blank" className="col-span-1 flex flex-col items-center justify-center bg-green-500 text-white py-2 rounded-lg text-xs font-bold"><MessageSquare size={14} /> WA</a>
                      <button onClick={() => { setShowNotesModal(lead); setNoteText(lead.notes || ''); }} className="col-span-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold flex flex-col items-center"><StickyNote size={14} /> Note</button>
                      <button onClick={() => { setShowReportModal(lead); setReportReason(''); }} className="col-span-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold flex flex-col items-center"><Flag size={14} /> Report</button>
                    </div>

                    <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value)} className="w-full text-xs border rounded-lg p-2 bg-white"><option value="Fresh">🔵 Fresh</option><option value="Interested">✅ Interested</option><option value="Closed">🎉 Closed</option><option value="Call Back">🔄 Call Back</option><option value="Invalid">🚫 Invalid</option></select>
                  </div>
                );
              })}
            </div>
          }
        </div>
      </main>

      {showNotesModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl w-full max-w-sm p-4"><h3 className="font-bold mb-2">Add Note</h3><textarea value={noteText} onChange={e => setNoteText(e.target.value)} className="w-full border p-2 rounded h-24" /><div className="flex gap-2 mt-2"><button onClick={() => setShowNotesModal(null)} className="flex-1 border p-2 rounded">Cancel</button><button onClick={saveNote} className="flex-1 bg-blue-600 text-white p-2 rounded">Save</button></div></div></div>}
      
      {showReportModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl w-full max-w-sm p-4"><h3 className="font-bold text-red-600 mb-2">Report Invalid</h3><div className="grid grid-cols-2 gap-2 mb-2">{['Wrong Number', 'Not Interested'].map(r => <button key={r} onClick={() => setReportReason(r)} className="border p-1 text-xs rounded">{r}</button>)}</div><textarea value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full border p-2 rounded h-20" placeholder="Reason..." /><div className="flex gap-2 mt-2"><button onClick={() => setShowReportModal(null)} className="flex-1 border p-2 rounded">Cancel</button><button onClick={handleReportInvalidLead} className="flex-1 bg-red-600 text-white p-2 rounded">Report</button></div></div></div>}

      {!isExpired && <div className="fixed bottom-0 w-full bg-white p-3 border-t sm:hidden z-30"><button onClick={() => setShowSubscription(true)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2"><Zap size={18} /> Upgrade</button></div>}
      
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default MemberDashboard;
