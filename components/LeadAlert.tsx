import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { X, Bell, CheckCircle, Zap } from 'lucide-react';

// 🔔 Sound Link
const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export const LeadAlert = () => {
  const { session } = useAuth();
  const [lastLead, setLastLead] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // 1. Browser Notification Permission
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // ⚡ AUTO TEST: Page khulte hi 3 second ke liye popup dikhega
    // Taaki confirm ho jaye ki UI kaam kar raha hai
    setLastLead({ name: "System Ready", city: "Waiting for leads..." });
    setTestMode(true);
    setVisible(true);
    setTimeout(() => {
        setVisible(false);
        setTestMode(false);
    }, 3000);

    // 2. Realtime Listener
    const channel = supabase
      .channel('public:leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          // filter: `user_id=eq.${session.user.id}` // Filter OFF for testing
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
      new Notification("🔥 Lead Received", {
        body: `${lead.name} from ${lead.city}`,
        icon: "/vite.svg"
      });
    }

    // 8 second baad auto-hide
    setTimeout(() => setVisible(false), 8000);
  };

  if (!visible || !lastLead) return null;

  return (
    // 👇 FINAL FIX: Fixed Position Bottom + Inline Styles for safety
    <div 
      style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '10px', 
        right: '10px', 
        zIndex: 999999, // Sabse upar
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-600 w-full max-w-sm flex items-center gap-4 animate-bounce">
        
        {/* Icon */}
        <div className={`rounded-full p-3 shadow-lg ${testMode ? 'bg-blue-500' : 'bg-green-500'}`}>
          {testMode ? <Zap size={24} className="text-white" /> : <Bell size={24} className="text-white animate-pulse" />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-xs uppercase tracking-wider mb-0.5 ${testMode ? 'text-blue-400' : 'text-green-400'}`}>
            {testMode ? 'Test Mode' : 'New Lead!'}
          </p>
          <h3 className="font-bold text-white text-base truncate">{lastLead.name}</h3>
          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
            <CheckCircle size={10} /> {lastLead.city || 'Live Status'}
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={() => setVisible(false)}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
