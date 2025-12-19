import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { X, MessageCircle, CheckCircle } from 'lucide-react';

// 🔔 Sound Link
const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export const LeadAlert = () => {
  const { session } = useAuth();
  const [lastLead, setLastLead] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // 1. Permission (System Notification ke liye)
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
          // filter: `user_id=eq.${session.user.id}` // 👈 Testing ke liye filter OFF hai
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

    // B. Show In-App Popup (Screen ke upar)
    setLastLead(lead);
    setVisible(true);

    // C. System Notification (Agar user app se bahar hai tab dikhega)
    if (Notification.permission === "granted" && document.hidden) {
      new Notification("🔥 New Lead Received", {
        body: `${lead.name} from ${lead.city}`,
        icon: "/vite.svg"
      });
    }

    // 10 second baad auto-hide
    setTimeout(() => setVisible(false), 10000);
  };

  if (!visible || !lastLead) return null;

  return (
    // 👇 FINAL DESIGN: WhatsApp Style Notification at TOP
    <div className="fixed top-0 left-0 w-full z-[99999] animate-slide-down">
      <div className="bg-green-600 text-white px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
        
        {/* Left Side: Icon & Text */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-white/20 p-2 rounded-full shrink-0">
             <MessageCircle size={24} className="text-white animate-bounce" />
          </div>
          <div className="min-w-0">
             <p className="text-xs font-bold text-green-100 uppercase tracking-wide">New Lead Received!</p>
             <p className="text-base font-bold truncate text-white leading-tight">{lastLead.name}</p>
             <p className="text-xs text-green-100 truncate flex items-center gap-1">
                <CheckCircle size={10} /> {lastLead.city || 'Waiting for location...'}
             </p>
          </div>
        </div>

        {/* Right Side: Close Button */}
        <button 
          onClick={() => setVisible(false)}
          className="p-2 bg-black/10 rounded-full hover:bg-black/20 shrink-0"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
