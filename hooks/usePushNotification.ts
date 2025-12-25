import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotification() {
    // ⚠️ Replace with your actual VAPID Public Key directly here to be 100% sure
    const VAPID_PUBLIC_KEY = "BOi4O_qTZndnapSjTjiI8k3KfrT6rCkCkj0a4uoA6tVr2-mbEEypXnLcSlUmMuvzjrXY2Ixv2iIUWBwawFN7TXU";
    
    const [state, setState] = useState<any>({
        isSupported: false,
        isLoading: true,
        permission: 'default',
        isSubscribed: false,
        error: null,
    });
    
    const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        const init = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setState(s => ({ ...s, isSupported: false, isLoading: false }));
                return;
            }

            try {
                // Register SW
                const reg = await navigator.serviceWorker.register('/sw.js');
                swRegistrationRef.current = reg;
                
                const sub = await reg.pushManager.getSubscription();
                
                setState({
                    isSupported: true,
                    isLoading: false,
                    permission: Notification.permission,
                    isSubscribed: !!sub,
                    error: null
                });
            } catch (err: any) {
                console.error(err);
                setState(s => ({ ...s, error: 'SW Init Failed: ' + err.message }));
            }
        };
        init();
    }, []);

    const subscribe = async () => {
        try {
            // 1. Permission
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') throw new Error('Permission Denied');

            // 2. Subscribe Browser
            if (!swRegistrationRef.current) throw new Error('Service Worker not ready');
            
            const sub = await swRegistrationRef.current.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // 3. Prepare Data
            const json = sub.toJSON();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                alert("❌ Please Login First!");
                return;
            }

            // 4. Save to DB (With Alert Debugging)
            alert(`Saving subscription for User: ${user.email}`);

            const { error } = await supabase.from('push_subscriptions').upsert({
                user_id: user.id,
                endpoint: json.endpoint,
                p256dh: json.keys?.p256dh,
                auth: json.keys?.auth,
                user_agent: navigator.userAgent
            });

            if (error) {
                alert("❌ DB Error: " + error.message);
                throw error;
            }

            alert("✅ Subscription Saved Successfully!");
            setState(s => ({ ...s, isSubscribed: true }));

        } catch (err: any) {
            alert("❌ Subscribe Error: " + err.message);
            setState(s => ({ ...s, error: err.message }));
        }
    };

    return { ...state, subscribe };
}
