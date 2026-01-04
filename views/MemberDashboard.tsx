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
// GLOBAL HELPER FUNCTIONS (Outside to prevent ReferenceErrors)
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

// ============================================================
// MAIN COMPONENT
// ============================================================

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managerName, setManagerName] = useState('Direct');

  // Filters & Modals
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showNotesModal, setShowNotesModal] = useState<any | null>(null);
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
  const leadsToday = profile?.leads_today || 0;
  const dailyLimit = profile?.daily_limit || 0;
  const remainingToday = Math.max(0, dailyLimit - leadsToday);
  const dailyProgress = dailyLimit > 0 ? Math.min(100, Math.round((leadsToday / dailyLimit) * 100)) : 0;
  const isLimitReached = dailyLimit > 0 && leadsToday >= dailyLimit;
  const isPaused = profile?.is_active === false;

  const deliveryStatus = useMemo(() => {
    if (!profile) return { title: 'Loading...', subtitle: 'Please wait', icon: Clock, iconBgColor: 'bg-white/20', iconColor: 'text-white' };
    if (profile.payment_status !== 'active' || isExpired) return { title: 'Plan Inactive', subtitle: 'Renew to get leads', icon: AlertTriangle, iconBgColor: 'bg-red-500/30', iconColor: 'text-red-200' };
    if (isPaused) return { title: 'Paused', subtitle: 'Delivery is on hold', icon: Pause, iconBgColor: 'bg-orange-500/30', iconColor: 'text-orange-200' };
    if (!isWithinWorkingHours()) return { title: 'Off Hours', subtitle: 'Starts at 8 AM', icon: Moon, iconBgColor: 'bg-white/20', iconColor: 'text-indigo-200' };
    if (isLimitReached) return { title: 'Limit Reached', subtitle: 'Done for today', icon: CheckCircle2, iconBgColor: 'bg-green-500/30', iconColor: 'text-green-200' };
    return { title: 'Active Delivery', subtitle: `${remainingToday} leads remaining`, icon: Zap, iconBgColor: 'bg-green-500/30', iconColor: 'text-green-300' };
  }, [profile, isExpired, isPaused, isLimitReached, remainingToday]);

  // Fetch Data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
      setProfile(userData);
      if (userData?.manager_id) {
        const { data: mData } = await supabase.from('users').select('name').eq('id', userData.manager_id).maybeSingle();
        setManagerName(mData?.name || 'Direct');
      }
      const { data: leadsData } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setLeads(leadsData || []);
    } catch (err) { console.error(err); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Handlers
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l)));
    await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', leadId);
  };

  const handleReportInvalid = async (lead: any) => {
    const reason = window.prompt("Reason for Report/Replacement? (e.g. Wrong Number, Switched Off)");
    if (!reason) return;
    try {
      await supabase.from('lead_replacements').insert({ lead_id: lead.id, user_id: profile?.id, reason: reason });
      await handleStatusChange(lead.id, 'Invalid');
      alert("Report sent! Replacement will be processed within 24h.");
    } catch (err) { alert("Error reporting lead."); }
  };

  const saveNote = async () => {
    if (!showNotesModal) return;
    setSavingNote(true);
    try {
      await supabase.from('leads').update({ notes: noteText, updated_at: new Date().toISOString() }).eq('id', showNotesModal.id);
      setLeads(prev => prev.map(l => (l.id === showNotesModal.id ? { ...l, notes: noteText } : l)));
      setShowNotesModal(null);
    } catch (err) { alert("Error saving note."); } finally { setSavingNote(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-blue-600" /></div>;

  const StatusIcon = deliveryStatus.icon;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {showSubscription && <Subscription onClose={() => setShowSubscription(false)} />}

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 p-4 flex justify-between items-center shadow-sm">
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 truncate">👋 {profile?.name?.split(' ')[0]}</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold">{profile?.plan_name} • {managerName}</p>
        </div>
        <div className="flex gap-2">
          {profile?.sheet_url && <a href={profile.sheet_url} target="_blank" className="p-2 bg-green-600 text-white rounded-lg"><FileSpreadsheet size={18} /></a>}
          <button onClick={fetchData} className="p-2 bg-slate-100 rounded-lg"><RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /></button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 bg-red-50 text-red-600 rounded-lg"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Premium Delivery Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl p-6 shadow-xl shadow-indigo-200">
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${deliveryStatus.iconBgColor} backdrop-blur-md`}>
                <StatusIcon size={30} className={deliveryStatus.iconColor} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">System Status</p>
                <h2 className="text-xl font-black">{deliveryStatus.title}</h2>
                <p className="text-xs text-indigo-100">{deliveryStatus.subtitle}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-center border border-white/10">
                <p className="text-xl font-black">{remainingToday}</p>
                <p className="text-[10px] uppercase opacity-70">Remaining</p>
              </div>
              <button onClick={() => setShowDeliveryInfo(true)} className="p-3 bg-white/10 rounded-xl border border-white/10"><AlertCircle size={20}/></button>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between text-[10px] font-bold uppercase mb-2"><span>Today's Progress</span><span>{leadsToday}/{dailyLimit}</span></div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-700" style={{ width: `${dailyProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Lead List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b font-bold text-slate-800">My Recent Leads</div>
          {leads.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Leads will appear here! 🚀</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{lead.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {lead.city} • {getTimeAgo(lead.created_at)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(lead.status)}`}>{lead.status}</span>
                  </div>

                  {lead.notes && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-slate-600 italic">
                      " {lead.notes} "
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    <a href={`tel:${lead.phone}`} className="col-span-1 p-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm hover:bg-blue-100 transition-all">Call</a>
                    <a href={getWhatsAppLink(lead.phone, lead.name)} target="_blank" className="col-span-1 p-3 bg-green-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-green-100">WA</a>
                    
                    {/* Notes Button - Restore Original */}
                    <button 
                      onClick={() => { setShowNotesModal(lead); setNoteText(lead.notes || ''); }} 
                      className="col-span-1 p-3 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all"
                      title="Add Note"
                    >
                      <StickyNote size={18} />
                    </button>

                    {/* Report/Replacement Button - New */}
                    <button 
                      onClick={() => handleReportInvalid(lead)} 
                      className="col-span-1 p-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
                      title="Report Lead"
                    >
                      <AlertTriangle size={18} />
                    </button>
                  </div>

                  <div className="relative mt-3">
                    <select 
                      value={lead.status} 
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="Fresh">🔵 Fresh</option>
                      <option value="Contacted">📞 Contacted</option>
                      <option value="Interested">✅ Interested</option>
                      <option value="Closed">🎉 Closed</option>
                      <option value="Rejected">❌ Rejected</option>
                      <option value="Invalid">🚫 Invalid Number</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upgrade Sticky CTA */}
      {!isExpired && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 md:hidden z-30">
          <button onClick={() => setShowSubscription(true)} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
            <Zap size={18} /> Upgrade for More Leads
          </button>
        </div>
      )}

      {/* Modals */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-slate-900">Add Note</h3>
              <button onClick={() => setShowNotesModal(null)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            <textarea 
              value={noteText} 
              onChange={(e) => setNoteText(e.target.value)} 
              className="w-full border-2 border-slate-100 rounded-2xl p-4 h-40 focus:border-indigo-500 outline-none transition-all text-sm" 
              placeholder="Ex: Call back tomorrow at 5 PM..." 
            />
            <button 
              onClick={saveNote} 
              disabled={savingNote}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold mt-4 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {savingNote ? <RefreshCw className="animate-spin" /> : <><Check size={18}/> Save Notes</>}
            </button>
          </div>
        </div>
      )}

      {showDeliveryInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Delivery Info</h3>
              <button onClick={() => setShowDeliveryInfo(false)}><X /></button>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="font-bold text-blue-900 text-sm">Working Hours</p>
                <p className="text-xs text-blue-700">Leads are delivered between 8 AM – 10 PM IST.</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="font-bold text-purple-900 text-sm">Priority Distribution</p>
                <p className="text-xs text-purple-700">Manager & Supervisor plans get leads before Starter plans.</p>
              </div>
              <button onClick={() => { setShowDeliveryInfo(false); setShowSubscription(true); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm mt-2">Get Higher Priority</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-in { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default MemberDashboard;
