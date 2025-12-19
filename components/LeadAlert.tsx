import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';

// 🔔 Stronger Sound (Jo browser block na kare)
const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export const LeadAlert = () => {
  const { session } = useAuth();
  const [status, setStatus] = useState("Initializing...");
  const [lastLog, setLastLog] = useState("");

  useEffect(() => {
    if (!session?.user) {
      setStatus("No User Session");
      return;
    }

    // 1. Permission Check
    if (Notification.permission === "default") {
      Notification.requestPermission().then(p => setStatus(`Permission: ${p}`));
    } else {
      setStatus(`Permission: ${Notification.permission}`);
    }

    console.log("🟢 Listening for leads for User:", session.user.id);

    // 2. Supabase Realtime Listener
    const channel = supabase
      .channel('public:leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('🔔 REALTIME EVENT RECEIVED!', payload);
          setLastLog(`Lead Recd: ${payload.new.name}`);
          playAlert(payload.new);
        }
      )
      .subscribe((status) => {
        console.log("📡 Subscription Status:", status);
        if (status === 'SUBSCRIBED') setStatus("🟢 Online & Listening");
        if (status === 'CHANNEL_ERROR') setStatus("🔴 Connection Error");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const playAlert = (lead: any = { name: "Test Lead", city: "Demo City" }) => {
    try {
      // 🔊 Play Sound
      const audio = new Audio(ALERT_SOUND);
      audio.volume = 1.0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio Play Failed (Browser Blocked):", error);
          alert("⚠️ Audio blocked! Please interact with the page first.");
        });
      }

      // 💬 Show Popup
      if (Notification.permission === "granted") {
        const notif = new Notification("🔥 New Lead Received!", {
          body: `${lead.name} from ${lead.city}\nClick to Call Now!`,
          icon: "/vite.svg",
          requireInteraction: true // Ye notification tab tak nahi hatega jab tak click na karo
        });
        
        notif.onclick = () => {
          window.focus();
          // Optional: Navigate to lead
        };
      } else {
        console.warn("Notification permission not granted!");
        alert("Please allow notifications in browser settings!");
      }
    } catch (e) {
      console.error("Notification Error:", e);
    }
  };

  // 👇 Ye Button Sirf Testing ke liye hai (Baad mein hata dena)
  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-50 text-xs border border-slate-700 max-w-xs">
      <p className="font-bold text-yellow-400 mb-1">🔔 Notification Debugger</p>
      <p>Status: {status}</p>
      {lastLog && <p className="text-green-400 mt-1">Last: {lastLog}</p>}
      
      <button 
        onClick={() => playAlert()}
        className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold transition-all active:scale-95"
      >
        Test Sound & Popup 🔊
      </button>
    </div>
  );
};
