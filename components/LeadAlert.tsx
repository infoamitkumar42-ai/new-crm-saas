import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { X, Bell, CheckCircle } from 'lucide-react';

// 🔔 Sound Link
const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export const LeadAlert = () => {
  const { session } = useAuth();
  const [lastLead, setLastLead] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // 1. Browser Notification Permission
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // 2. Realtime Listener
    const channel = supabase
      .channel('public:leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          // filter: `user_id=eq.${session.user.id}` // Filter abhi OFF hai testing ke liye
        },
        (payload) => {
          console.log('🔔 NEW LEAD!', payload);
          triggerAlert(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const triggerAlert = (lead: any) => {
    // A. Play Sound
    try {
      const audio = new Audio(ALERT_SOUND);
      audio.play().catch(e => console.log("Audio Error:", e));
    } catch(e) {}

    // B. Show In-App Popup
    setLastLead(lead);
    setVisible(true);

    // C. System Notification
    if (Notification.permission === "granted") {
      new Notification("Lead Received", {
        body: `${lead.name} from ${lead.city}`,
        icon: "/vite.svg"
      });
    }

    // 5 second baad auto-hide
    setTimeout(() => setVisible(false), 8000);
  };

  if (!visible || !lastLead) return null;

  return (
    // 👇 MOBILE UI FIX: Z-Index 9999, Top Fixed, No fancy animation
    <div className="fixed top-2 left-2 right-2 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[9999] flex justify-center">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700 w-full max-w-sm flex items-center gap-4 transition-all duration-300 transform translate-y-0">
        
        {/* Icon */}
        <div className="bg-green-500 rounded-full p-3 shadow-lg shadow-green-500/30 shrink-0">
          <Bell size={24} className="text-white fill-white animate-pulse" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-green-400 text-xs uppercase tracking-wider mb-0.5">New Lead!</p>
          <h3 className="font-bold text-white text-base truncate">{lastLead.name}</h3>
          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
            <CheckCircle size={10} /> {lastLead.city || 'India'}
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={() => setVisible(false)}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
