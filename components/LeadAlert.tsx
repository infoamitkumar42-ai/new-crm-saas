import React, { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';

// 🔔 Sound Effect URL
const ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export const LeadAlert = () => {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.user) return;

    // 1. Browser se Permission maango
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
          filter: `user_id=eq.${session.user.id}` // Sirf meri leads suno
        },
        (payload) => {
          console.log('🔔 New Lead!', payload);
          triggerNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const triggerNotification = (lead: any) => {
    try {
      // 🔊 Play Sound
      const audio = new Audio(ALERT_SOUND);
      audio.play().catch(e => console.log("Audio play blocked:", e));

      // 💬 Show Popup
      if (Notification.permission === "granted") {
        new Notification("🔥 New Lead Received!", {
          body: `${lead.name} from ${lead.city}\nClick to Call Now!`,
          icon: "/vite.svg"
        });
      }
    } catch (e) {
      console.error("Notification Error:", e);
    }
  };

  return null; // Ye screen par dikhta nahi hai
};
