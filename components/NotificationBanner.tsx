// =====================================================
// src/components/NotificationBanner.tsx
// Push Notification Enable/Disable Banner
// =====================================================

import React, { useState } from 'react';
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
    
    const [dismissed, setDismissed] = useState(false);
    
    // Hide if user dismissed
    if (dismissed) return null;

    // ─────────────────────────────────────────────────
    // Not Supported
    // ─────────────────────────────────────────────────
    if (!isSupported) {
        return (
            <div style={{
                position: 'fixed',
                top: 16,
                left: 16,
                right: 16,
                zIndex: 9999,
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '2px solid #f59e0b',
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>⚠️</span>
                        <div>
                            <div style={{ fontWeight: 700, color: '#92400e', fontSize: 16 }}>
                                Notifications Not Supported
                            </div>
                            <div style={{ color: '#b45309', fontSize: 14, marginTop: 2 }}>
                                Please use Chrome browser on Android
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setDismissed(true)}
                        style={{
                            background: 'rgba(0,0,0,0.1)',
                            border: 'none',
                            borderRadius: 8,
                            width: 32,
                            height: 32,
                            cursor: 'pointer',
                            fontSize: 18,
                        }}
                    >✕</button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────
    // Permission Denied
    // ─────────────────────────────────────────────────
    if (permission === 'denied') {
        return (
            <div style={{
                position: 'fixed',
                top: 16,
                left: 16,
                right: 16,
                zIndex: 9999,
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                border: '2px solid #ef4444',
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>🔕</span>
                        <div>
                            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 16 }}>
                                Notifications Blocked
                            </div>
                            <div style={{ color: '#b91c1c', fontSize: 14, marginTop: 2 }}>
                                Go to browser settings → Site Settings → Enable Notifications
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setDismissed(true)}
                        style={{
                            background: 'rgba(0,0,0,0.1)',
                            border: 'none',
                            borderRadius: 8,
                            width: 32,
                            height: 32,
                            cursor: 'pointer',
                            fontSize: 18,
                        }}
                    >✕</button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────
    // Already Subscribed ✅
    // ─────────────────────────────────────────────────
    if (isSubscribed) {
        return (
            <div style={{
                position: 'fixed',
                top: 16,
                left: 16,
                right: 16,
                zIndex: 9999,
                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                border: '2px solid #10b981',
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>✅</span>
                        <div>
                            <div style={{ fontWeight: 700, color: '#065f46', fontSize: 16 }}>
                                Notifications Enabled!
                            </div>
                            <div style={{ color: '#047857', fontSize: 14, marginTop: 2 }}>
                                You'll receive alerts for new leads
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                            onClick={testNotification}
                            style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: 14,
                            }}
                        >
                            Test 🔔
                        </button>
                        <button 
                            onClick={unsubscribe}
                            disabled={isLoading}
                            style={{
                                background: 'white',
                                color: '#dc2626',
                                border: '2px solid #dc2626',
                                borderRadius: 10,
                                padding: '10px 16px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: 14,
                                opacity: isLoading ? 0.6 : 1,
                            }}
                        >
                            {isLoading ? '...' : 'Disable'}
                        </button>
                        <button 
                            onClick={() => setDismissed(true)}
                            style={{
                                background: 'rgba(0,0,0,0.1)',
                                border: 'none',
                                borderRadius: 8,
                                width: 36,
                                height: 36,
                                cursor: 'pointer',
                                fontSize: 18,
                            }}
                        >✕</button>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────
    // Not Subscribed - Show Enable Button
    // ─────────────────────────────────────────────────
    return (
        <div style={{
            position: 'fixed',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
            color: 'white',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32, animation: 'bounce 1s infinite' }}>🔔</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>
                            Enable Push Notifications
                        </div>
                        <div style={{ opacity: 0.9, fontSize: 14, marginTop: 4 }}>
                            Get instant alerts when new leads arrive!
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                        onClick={subscribe}
                        disabled={isLoading}
                        style={{
                            background: 'white',
                            color: '#6366f1',
                            border: 'none',
                            borderRadius: 12,
                            padding: '12px 24px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 700,
                            fontSize: 15,
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'all 0.2s',
                        }}
                    >
                        {isLoading ? '⏳ Enabling...' : 'Enable Now'}
                    </button>
                    <button 
                        onClick={() => setDismissed(true)}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: 10,
                            width: 40,
                            height: 40,
                            cursor: 'pointer',
                            fontSize: 20,
                            color: 'white',
                        }}
                    >✕</button>
                </div>
            </div>
            
            {/* Error Message */}
            {error && (
                <div style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    fontSize: 14,
                }}>
                    ❌ {error}
                </div>
            )}
            
            {/* Bounce Animation */}
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
            `}</style>
        </div>
    );
};

export default NotificationBanner;
