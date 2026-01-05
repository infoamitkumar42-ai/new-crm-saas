// src/views/MemberDashboard.tsx

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import {
  Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare,
  X, Calendar, Target, Clock,
  StickyNote, Check, LogOut, Zap, Crown, Lock,
  Flame, ArrowUp, Bell, Shield,
  AlertCircle, ChevronDown, Moon, Pause, Play,
  CheckCircle2, AlertTriangle, Flag, Gift
} from 'lucide-react';
import { Subscription } from '../components/Subscription';

// Types
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

// Helper Functions
const getTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const diff = new Date().getTime() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
      setProfile(userData);

      const { data: leadsData } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const togglePause = async () => {
    if (!profile) return;
    const newStatus = !profile.is_active;
    
    // Optimistic Update
    setProfile({ ...profile, is_active: newStatus });
    
    const { error } = await supabase.from('users').update({ is_active: newStatus }).eq('id', profile.id);
    if (error) {
      setProfile({ ...profile, is_active: !newStatus }); // Revert
      alert('Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">👋 Welcome, {profile?.name}</h1>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 bg-white rounded-lg border hover:bg-slate-50">
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full ${profile?.is_active ? 'bg-green-500' : 'bg-orange-500'}`}></span>
              <p className="text-xl font-bold text-slate-900">
                {profile?.is_active ? 'Active & Receiving' : 'Paused'}
              </p>
            </div>
          </div>
          <button 
            onClick={togglePause}
            className={`px-4 py-2 rounded-lg font-bold text-sm text-white ${profile?.is_active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {profile?.is_active ? <><Pause size={16} className="inline mr-1"/> Pause</> : <><Play size={16} className="inline mr-1"/> Resume</>}
          </button>
        </div>

        {/* Extension Info */}
        {profile?.days_extended && profile.days_extended > 0 && (
          <div className="bg-green-50 text-green-700 p-3 rounded-xl flex items-center gap-2 text-sm font-medium mb-4">
            <Gift size={16} />
            Plan extended by {profile.days_extended} days due to missed leads!
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Today's Leads</p>
            <p className="text-2xl font-bold">{profile?.leads_today || 0} / {profile?.daily_limit || 0}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Total Received</p>
            <p className="text-2xl font-bold">{profile?.total_leads_received || 0} / {profile?.total_leads_promised || 0}</p>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-bold">Your Leads ({leads.length})</h2>
        </div>
        
        {leads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No leads yet.</div>
        ) : (
          <div>
            {leads.map((lead) => (
              <div key={lead.id} className="p-4 border-b last:border-0 hover:bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{lead.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin size={12} /> {lead.city} • {getTimeAgo(lead.created_at)}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold border border-blue-100">
                    {lead.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <a href={`tel:${lead.phone}`} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-center text-sm font-bold flex items-center justify-center gap-2">
                    <Phone size={16} /> Call
                  </a>
                  <a href={`https://wa.me/${lead.phone}`} target="_blank" className="flex-1 bg-green-500 text-white py-2 rounded-lg text-center text-sm font-bold flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSubscription && <Subscription onClose={() => setShowSubscription(false)} />}
    </div>
  );
};

export default MemberDashboard;
