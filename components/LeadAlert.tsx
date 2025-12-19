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

    // 1. Service Worker Register karo (Mobile Notification ke liye zaroori hai)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker Registered!', reg))
        .catch(err => console.log('❌ SW Error:', err));
    }

    // 2. Permission Maango
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // 3. Realtime Listener
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

  const triggerAlert = async (lead: any) => {
    // A. Play Sound
    try {
      const audio = new Audio(ALERT_SOUND);
      audio.play().catch(e => console.log("Audio Error:", e));
    } catch(e) {}

    // B. Show In-App Banner (Backup ke liye)
    setLastLead(lead);
    setVisible(true);

    // C. SYSTEM NOTIFICATION (MOBILE SPECIAL) 📲
    if (Notification.permission === "granted") {
      try {
        // Mobile par Service Worker ke through hi notification aata hai
        const registration = await navigator.serviceWorker.ready;
        
        registration.showNotification("🔥 New Lead Received!", {
          body: `${lead.name} from ${lead.city}\nTap to call now.`,
          icon: "/vite.svg", // Logo
          badge: "/vite.svg", // Small Icon
          vibrate: [200, 100, 200], // Phone Vibrate karega
          tag: "new-lead", // Naye notification purane ko replace nahi karenge
          renotify: true   // Har bar sound bajega
        });
        
      } catch (e) {
        console.error("Mobile Notification Error:", e);
        // Agar SW fail ho jaye to Desktop wala try karo
        new Notification("New Lead!", { body: lead.name });
      }
    }

    // 10 second baad in-app banner hatao
    setTimeout(() => setVisible(false), 10000);
  };

  if (!visible || !lastLead) return null;

  // 👇 In-App Banner (WhatsApp Style)
  return (
    <div className="fixed top-0 left-0 w-full z-[99999] animate-slide-down shadow-xl">
      <div className="bg-[#25D366] text-white px-4 py-3 flex items-center justify-between border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
             <MessageCircle size={20} className="text-[#25D366]" />
          </div>
          <div>
             <p className="text-[10px] font-bold text-green-100 uppercase">LeadFlow • Now</p>
             <p className="text-sm font-bold text-white">{lastLead.name}</p>
             <p className="text-xs text-green-50 flex items-center gap-1">
                <CheckCircle size={10} /> {lastLead.city || 'Waiting for location...'}
             </p>
          </div>
        </div>
        <button onClick={() => setVisible(false)} className="p-2 bg-black/10 rounded-full">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
