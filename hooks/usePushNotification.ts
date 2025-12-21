// =====================================================
// src/hooks/usePushNotification.ts
// VAPID Push Subscription Hook
// =====================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

// ─────────────────────────────────────────────────────
// Helper: Convert VAPID key to Uint8Array
// ─────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface PushState {
    isSupported: boolean;
    isLoading: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
    error: string | null;
}

// ─────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────
export function usePushNotification() {
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    const [state, setState] = useState<PushState>({
        isSupported: false,
        isLoading: true,
        permission: 'default',
        isSubscribed: false,
        error: null,
    });
    
    const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const initRef = useRef(false);

    // ─────────────────────────────────────────────────
    // Initialize on mount
    // ─────────────────────────────────────────────────
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
        
        initializePush();
    }, []);

    const initializePush = async () => {
        console.log('🔔 [Push] Initializing...');
        
        // Check browser support
        const isSupported = 
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;
        
        if (!isSupported) {
            console.warn('❌ [Push] Not supported in this browser');
            setState(prev => ({ 
                ...prev, 
                isSupported: false, 
                isLoading: false,
                error: 'Push notifications not supported'
            }));
            return;
        }
        
        if (!VAPID_PUBLIC_KEY) {
            console.error('❌ [Push] VAPID key missing');
            setState(prev => ({ 
                ...prev, 
                isLoading: false, 
                error: 'VAPID key not configured' 
            }));
            return;
        }
        
        try {
            // Register Service Worker
            console.log('📝 [Push] Registering SW...');
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('✅ [Push] SW Registered:', registration.scope);
            
            // Wait for SW to be ready
            await navigator.serviceWorker.ready;
            console.log('✅ [Push] SW Ready');
            
            swRegistrationRef.current = registration;
            
            // Check existing subscription
            const existingSub = await registration.pushManager.getSubscription();
            console.log('📋 [Push] Existing subscription:', existingSub ? 'Yes' : 'No');
            
            setState({
                isSupported: true,
                isLoading: false,
                permission: Notification.permission,
                isSubscribed: !!existingSub,
                error: null,
            });
            
        } catch (error: any) {
            console.error('❌ [Push] Init error:', error);
            setState(prev => ({
                ...prev,
                isSupported: true,
                isLoading: false,
                error: error.message || 'Failed to initialize'
            }));
        }
    };

    // ─────────────────────────────────────────────────
    // Subscribe to Push
    // ─────────────────────────────────────────────────
    const subscribe = useCallback(async (): Promise<boolean> => {
        console.log('🔔 [Push] Subscribing...');
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        try {
            // 1. Request permission
            console.log('📋 [Push] Requesting permission...');
            const permission = await Notification.requestPermission();
            console.log('📋 [Push] Permission result:', permission);
            
            setState(prev => ({ ...prev, permission }));
            
            if (permission !== 'granted') {
                throw new Error('Notification permission denied. Please allow notifications.');
            }
            
            // 2. Check SW registration
            if (!swRegistrationRef.current) {
                throw new Error('Service Worker not ready. Please refresh the page.');
            }
            
            // 3. Subscribe to push manager
            console.log('🔐 [Push] Creating subscription...');
            const subscription = await swRegistrationRef.current.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            
            console.log('✅ [Push] Subscription created!');
            console.log('📋 [Push] Endpoint:', subscription.endpoint.substring(0, 50) + '...');
            
            // 4. Get subscription keys
            const subscriptionJson = subscription.toJSON();
            const endpoint = subscriptionJson.endpoint!;
            const p256dh = subscriptionJson.keys!.p256dh;
            const auth = subscriptionJson.keys!.auth;
            
            // 5. Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Please login first to enable notifications.');
            }
            
            console.log('👤 [Push] User:', user.email);
            
            // 6. Save to database
            console.log('💾 [Push] Saving to database...');
            const { error: dbError } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint: endpoint,
                    p256dh: p256dh,
                    auth: auth,
                    user_agent: navigator.userAgent,
                }, {
                    onConflict: 'user_id,endpoint',
                });
            
            if (dbError) {
                console.error('❌ [Push] DB Error:', dbError);
                throw new Error('Failed to save subscription: ' + dbError.message);
            }
            
            console.log('✅ [Push] Saved to database!');
            
            setState(prev => ({
                ...prev,
                isSubscribed: true,
                permission: 'granted',
                isLoading: false,
                error: null,
            }));
            
            return true;
            
        } catch (error: any) {
            console.error('❌ [Push] Subscribe error:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Subscription failed'
            }));
            return false;
        }
    }, [VAPID_PUBLIC_KEY]);

    // ─────────────────────────────────────────────────
    // Unsubscribe from Push
    // ─────────────────────────────────────────────────
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        console.log('🔕 [Push] Unsubscribing...');
        setState(prev => ({ ...prev, isLoading: true }));
        
        try {
            if (!swRegistrationRef.current) {
                setState(prev => ({ ...prev, isLoading: false }));
                return true;
            }
            
            // Get current subscription
            const subscription = await swRegistrationRef.current.pushManager.getSubscription();
            
            if (subscription) {
                const endpoint = subscription.endpoint;
                
                // Unsubscribe from browser
                await subscription.unsubscribe();
                console.log('✅ [Push] Unsubscribed from browser');
                
                // Remove from database
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('endpoint', endpoint);
                    console.log('✅ [Push] Removed from database');
                }
            }
            
            setState(prev => ({
                ...prev,
                isSubscribed: false,
                isLoading: false,
                error: null,
            }));
            
            return true;
            
        } catch (error: any) {
            console.error('❌ [Push] Unsubscribe error:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message
            }));
            return false;
        }
    }, []);

    // ─────────────────────────────────────────────────
    // Test Notification (Local)
    // ─────────────────────────────────────────────────
    const testNotification = useCallback(async () => {
        console.log('🧪 [Push] Testing notification...');
        
        if (!swRegistrationRef.current) {
            console.error('SW not ready');
            return;
        }
        
        if (state.permission !== 'granted') {
            console.error('Permission not granted');
            return;
        }
        
        try {
            await swRegistrationRef.current.showNotification('🧪 Test Notification', {
                body: 'Push notifications are working correctly!',
                icon: '/vite.svg',
                tag: 'test-' + Date.now(),
                vibrate: [200, 100, 200],
            });
            console.log('✅ [Push] Test notification sent!');
        } catch (error) {
            console.error('❌ [Push] Test failed:', error);
        }
    }, [state.permission]);

    // ─────────────────────────────────────────────────
    // Return
    // ─────────────────────────────────────────────────
    return {
        ...state,
        subscribe,
        unsubscribe,
        testNotification,
    };
}

export default usePushNotification;
