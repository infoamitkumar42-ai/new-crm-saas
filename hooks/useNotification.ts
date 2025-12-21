// src/hooks/useNotification.ts

import { useState, useEffect, useCallback } from 'react';

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  swRegistration: ServiceWorkerRegistration | null;
  isReady: boolean;
}

export const useNotification = () => {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
    swRegistration: null,
    isReady: false,
  });

  // Initialize Service Worker and check permissions
  useEffect(() => {
    const init = async () => {
      // Check if notifications are supported
      const isSupported = 'Notification' in window && 
                          'serviceWorker' in navigator &&
                          'PushManager' in window;

      if (!isSupported) {
        console.warn('❌ Notifications not supported');
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      try {
        // Register Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('✅ SW Registered with scope:', registration.scope);

        // Wait for SW to be ready
        const readyRegistration = await navigator.serviceWorker.ready;
        console.log('✅ SW is Ready');

        // Check if there's a waiting worker and skip it
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New SW available');
              }
            });
          }
        });

        setState({
          permission: Notification.permission,
          isSupported: true,
          swRegistration: readyRegistration,
          isReady: true,
        });

      } catch (error) {
        console.error('❌ SW Registration failed:', error);
        setState(prev => ({ ...prev, isSupported: false }));
      }
    };

    init();
  }, []);

  // Request Permission (must be called on user gesture!)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('📋 Permission result:', permission);
      
      setState(prev => ({ ...prev, permission }));
      
      return permission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, [state.isSupported]);

  // Show Notification via Service Worker
  const showNotification = useCallback(async (
    title: string,
    options: {
      body?: string;
      icon?: string;
      tag?: string;
      url?: string;
      leadId?: string;
    } = {}
  ): Promise<boolean> => {
    console.log('🔔 Attempting to show notification...');
    console.log('   Permission:', state.permission);
    console.log('   SW Ready:', state.isReady);
    console.log('   SW Registration:', !!state.swRegistration);

    if (state.permission !== 'granted') {
      console.warn('❌ Notification permission not granted');
      return false;
    }

    if (!state.swRegistration) {
      console.warn('❌ Service Worker not ready');
      return false;
    }

    try {
      // Method 1: Direct showNotification (preferred)
      await state.swRegistration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: options.tag || `lead-${Date.now()}`,
        renotify: true,
        requireInteraction: false,
        silent: false,
        data: {
          url: options.url || '/',
          leadId: options.leadId,
          timestamp: Date.now()
        }
      });

      console.log('✅ Notification shown successfully!');
      return true;

    } catch (error) {
      console.error('❌ showNotification failed:', error);
      
      // Method 2: Fallback - Send message to SW
      try {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options
          });
          console.log('✅ Fallback: Message sent to SW');
          return true;
        }
      } catch (e) {
        console.error('❌ Fallback also failed:', e);
      }
      
      return false;
    }
  }, [state.permission, state.swRegistration, state.isReady]);

  return {
    ...state,
    requestPermission,
    showNotification,
  };
};
