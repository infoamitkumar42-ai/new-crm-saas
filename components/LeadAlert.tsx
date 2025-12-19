import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { X } from 'lucide-react';

// 🔔 Sound Link
const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export const LeadAlert = () => {
  const { session } = useAuth();
  const [lastLead, setLastLead] = useState<any>(null); // Last lead data store karne ke liye
  const [showPopup, setShowPopup] = useState(false);   // Popup dikhana hai ya nahi

  useEffect(() => {
    if (!session?.user) return;

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // 2. Supabase Realtime Listener
    const channel = supabase
      .channel('public:leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          // filter: `user_id=eq.${session.user.id}` // 👈 Filter hata diya hai testing ke liye
        },
        (payload) => {
          console.log('🔔 EVENT RECEIVED!', payload);
          triggerAlert(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const triggerAlert = (lead: any) => {
    // 1. Play Sound
    try {
      const audio = new Audio(ALERT_SOUND);
      audio.play().catch(e => console.log("Audio Blocked:", e));
    } catch(e) {}

    // 2. Show In-App Popup (Ye Mobile pe bhi dikhega)
    setLastLead(lead);
    setShowPopup(true);

    // 3. System Notification (Agar user app se bahar hai)
    if (Notification.permission === "granted") {
      new Notification("🔥 New Lead Arrived!", {
        body: `Check now: ${lead.name}`,
        icon: "/vite.svg"
      });
    }

    // 5 second baad popup apne aap band ho jayega
    setTimeout(() => setShowPopup(false), 8000);
  };

  if (!showPopup || !lastLead) return null;

  return (
    // 👇 IMPROVED MOBILE UI (Top Center)
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-bounce-in">
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
        
        {/* Left Icon */}
        <div className="bg-green-500 rounded-full p-2 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="font-bold text-sm text-green-400">New Lead Received!</p>
          <p className="text-sm font-semibold text-white">{lastLead.name}</p>
          <p className="text-xs text-slate-400">{lastLead.city || 'Unknown City'}</p>
        </div>

        {/* Close Button */}
        <button onClick={() => setShowPopup(false)} className="text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
