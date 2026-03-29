// components/PwaInstallPrompt.tsx
// PWA Install Prompt — shows bottom popup to unauthenticated/uninstalled users

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

// Extend Window type for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-prompt-dismissed';

const PwaInstallPrompt: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone) return;

    // Don't show if dismissed this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    // Don't show if not authenticated
    if (!isAuthenticated) return;

    // iOS: show immediately (no beforeinstallprompt available)
    if (isIos) {
      setVisible(true);
      return;
    }

    // Android/Chrome: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If app is already installable (event fired before we listened), check flag
    // Show popup immediately for authenticated users even without the event
    // so they see it on every login (event may not always fire on every visit)
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem(DISMISS_KEY) && isAuthenticated) {
        setVisible(true);
      }
    }, 2000); // Small delay so main UI loads first

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [isAuthenticated, isIos, isStandalone]);

  const handleInstall = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // No native prompt available — show iOS-style instructions as fallback
      setShowIosInstructions(true);
      return;
    }

    try {
      setInstalling(true);
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setVisible(false);
      }
    } catch (err) {
      console.warn('PWA install error:', err);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible || isStandalone) return null;

  return (
    <>
      {/* Backdrop (subtle) */}
      <div
        className="fixed inset-0 bg-black/20 z-[9998]"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Popup — slides up from bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="App Install Karo"
      >
        <div className="bg-white rounded-t-2xl shadow-2xl border-t border-slate-100 p-5 mx-0 safe-area-inset-bottom">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  App Install Karo — Better Experience!
                </h2>
                <p className="text-xs text-blue-600 font-medium mt-0.5">LeadFlow CRM</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-100"
              aria-label="Baad mein"
            >
              <X size={20} />
            </button>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            LeadFlow app install karo apne phone mein.{' '}
            <span className="text-slate-800 font-medium">Faster loading, instant notifications, aur offline access</span>{' '}
            milega.
          </p>

          {/* iOS Instructions */}
          {showIosInstructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                <Share size={13} />
                iOS mein install kaise karein:
              </p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal pl-4 leading-relaxed">
                <li>Safari mein <strong>Share button (⬆️)</strong> dabao</li>
                <li><strong>"Add to Home Screen"</strong> select karo</li>
                <li>Top right mein <strong>"Add"</strong> tap karo</li>
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-all shadow-md shadow-blue-200 disabled:opacity-60"
            >
              <Download size={16} />
              {installing ? 'Installing...' : 'Install Now'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-5 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Baad Mein
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PwaInstallPrompt;
export { PwaInstallPrompt };
