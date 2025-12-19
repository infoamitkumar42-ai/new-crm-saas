import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';

// 🔔 Sound Link
const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export const LeadAlert = () => {
  const { session } = useAuth();
  const [status, setStatus] = useState("Connecting...");
  const [lastEvent, setLastEvent] = useState("Waiting...");

  useEffect(() => {
    if (!session?.user) return;

    // 1. Permission Check
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    console.log("🟢 Listening for ALL leads...");

    // 2. Supabase Realtime Listener (GLOBAL MODE - No Filter)
    const channel = supabase
      .channel('public:leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          // filter: `user_id=eq.${session.user.id}` // 👈 Isko comment kar diya taaki sab kuch sunayi de
        },
        (payload) => {
          console.log('🔔 EVENT RECEIVED!', payload);
          setLastEvent(`Lead: ${payload.new.name}`);
          triggerNotification(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setStatus("🟢 Online & Ready");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const triggerNotification = (lead: any) => {
    try {
      const audio = new Audio(ALERT_SOUND);
      audio.play().catch(e => console.log("Audio Blocked:", e));

      if (Notification.permission === "granted") {
        new Notification("🔥 New Lead!", {
          body: `${lead.name} from ${lead.city}`,
          icon: "/vite.svg"
        });
      }
    } catch (e) { console.error(e); }
  };

  // 👇 Debugger Box (Screen par dikhega)
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-xl text-xs z-50 border border-gray-700 opacity-90">
      <p className="font-bold text-green-400">{status}</p>
      <p className="mt-1 text-yellow-300">Last Event: {lastEvent}</p>
      <p className="mt-2 text-gray-400 select-all">My ID: {session?.user?.id}</p>
    </div>
  );
};
