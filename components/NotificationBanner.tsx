// =====================================================
// src/components/NotificationBanner.tsx
// Compact & Professional Notification Banner
// =====================================================

import React, { useState, useEffect } from 'react';
import { usePushNotification } from '../hooks/usePushNotification';

export const NotificationBanner: React.FC = () => {
    const {
        isSupported,
        isLoading,
        permission,
        isSubscribed,
        error,
        subscribe,
        unsubscribe,
        testNotification,
    } = usePushNotification();

    const [dismissed, setDismissed] = useState(() => {
        return localStorage.getItem('hide_push_prompt') === 'true';
    });

    const [showSuccess, setShowSuccess] = useState(false);

    // Auto-hide success message after 3 seconds
    useEffect(() => {
        // If permission is already granted, don't show prompt
        if (Notification.permission === 'granted' && !isSubscribed) {
            setDismissed(true);
        }

        if (isSubscribed && !dismissed) {
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isSubscribed, dismissed]);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('hide_push_prompt', 'true');
    };

    // Don't show anything if:
    // - User dismissed it
    // - Already subscribed and success message hidden
    // - Not supported
    if (dismissed) return null;
    if (isSubscribed && !showSuccess) return null;
    if (!isSupported) return null;

    // ─────────────────────────────────────────────────
    // Permission Denied - Compact Warning
    // ─────────────────────────────────────────────────
    if (permission === 'denied') {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                background: '#fef2f2',
                borderBottom: '1px solid #fecaca',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 14,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🔕</span>
                    <span style={{ color: '#991b1b' }}>
                        Notifications blocked.
                        <a href="#" style={{ marginLeft: 4, color: '#dc2626', textDecoration: 'underline' }}>
                            Enable in settings
                        </a>
                    </span>
                </div>
                <button
                    onClick={handleDismiss}
                    style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#991b1b' }}
                >×</button>
            </div>
        );
    }

    // ─────────────────────────────────────────────────
    // Already Subscribed - Compact Success (Auto-hides)
    // ─────────────────────────────────────────────────
    if (isSubscribed && showSuccess) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                background: 'linear-gradient(90deg, #059669, #10b981)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <span>Push notifications enabled! You'll receive lead alerts.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={testNotification}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        Test 🔔
                    </button>
                    <button
                        onClick={() => setShowSuccess(false)}
                        style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'white' }}
                    >×</button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────
    // Not Subscribed - Compact Enable Banner
    // ─────────────────────────────────────────────────
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, animation: 'pulse 2s infinite' }}>🔔</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                    Enable notifications for instant lead alerts
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                    onClick={subscribe}
                    disabled={isLoading}
                    style={{
                        background: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 16px',
                        color: '#4f46e5',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        opacity: isLoading ? 0.7 : 1,
                    }}
                >
                    {isLoading ? '...' : 'Enable'}
                </button>
                <button
                    onClick={handleDismiss}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'white' }}
                >×</button>
            </div>

            {/* Error Toast */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 16,
                    right: 16,
                    background: '#fef2f2',
                    color: '#991b1b',
                    padding: '8px 12px',
                    borderRadius: '0 0 8px 8px',
                    fontSize: 13,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                    ❌ {error}
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
};

export default NotificationBanner;
