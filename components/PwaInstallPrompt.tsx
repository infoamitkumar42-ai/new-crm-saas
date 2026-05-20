// ─────────────────────────────────────────────────────────────────────────────
// PwaInstallPrompt.tsx
// Module-level deferredPrompt capture (MUST be outside component so the event
// isn't missed before React mounts).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Download, X, Share2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

// ── Module-level capture ──────────────────────────────────────────────────────
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const DISMISSED_KEY = 'pwa-prompt-dismissed';

function isAlreadyInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    !!(window.navigator as Navigator & { standalone?: boolean }).standalone
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

// CriOS = Chrome on iOS
function isIOSChrome(): boolean {
  return isIOS() && /CriOS/.test(navigator.userAgent);
}

type Platform = 'android' | 'ios-safari' | 'ios-chrome';

// ── Component ─────────────────────────────────────────────────────────────────
export function PwaInstallPrompt() {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible]   = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [show, setShow]         = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAlreadyInstalled()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS()) {
      setPlatform(isIOSChrome() ? 'ios-chrome' : 'ios-safari');
      setVisible(true);
      setTimeout(() => setShow(true), 50);
    } else {
      const check = () => {
        if (deferredPrompt) {
          setPlatform('android');
          setVisible(true);
          setTimeout(() => setShow(true), 50);
        }
      };
      check();
      const timer = setTimeout(check, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      dismiss(true);
    }
  };

  const dismiss = (permanent = false) => {
    setShow(false);
    setTimeout(() => setVisible(false), 300);
    if (permanent) {
      localStorage.setItem('pwa-installed', 'true');
    } else {
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    }
  };

  if (!visible) return null;
  if (localStorage.getItem('pwa-installed')) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-[9998]" onClick={() => dismiss()} />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[9999] flex justify-center transition-transform duration-300 ease-out ${
          show ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl px-5 pt-5 pb-8">

          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

          {/* Close */}
          <button
            onClick={() => dismiss()}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base leading-tight">
                LeadFlow App Install Karo!
              </p>
              <p className="text-xs text-gray-500 mt-0.5">leadflowcrm.in</p>
            </div>
          </div>

          {/* ──────────── ANDROID ──────────── */}
          {platform === 'android' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Instant lead notifications ke liye app install karo — WhatsApp ki tarah notification aayegi! 🔔
              </p>
              <button
                onClick={handleInstall}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-base"
              >
                <Download size={18} />
                App Install Karo
              </button>
              <button
                onClick={() => dismiss()}
                className="w-full text-gray-400 text-sm mt-3 py-1"
              >
                Baad Mein
              </button>
            </>
          )}

          {/* ──────────── iPHONE + CHROME (wrong browser) ──────────── */}
          {platform === 'ios-chrome' && (
            <>
              {/* Red warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm font-bold text-red-700">
                    ⚠️ Aap Chrome use kar rahe ho!
                  </p>
                </div>
                <p className="text-xs text-red-600 leading-5">
                  iPhone pe <strong>Chrome se install karne ke baad bhi lead notifications nahi aayengi.</strong>{' '}
                  Notifications ke liye <strong>Safari browser zaroori hai.</strong>
                </p>
              </div>

              {/* Steps to switch to Safari */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-blue-900 mb-3">
                  Safari mein kaise kholein:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-blue-800 leading-5">
                      Phone mein <strong>Safari app</strong> 🧭 kholo
                      <span className="block text-blue-500 mt-0.5">(Chrome band karo, Safari alag se kholo)</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-blue-800 leading-5">
                      Address bar mein type karo:{' '}
                      <strong className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">leadflowcrm.in</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-blue-800 leading-5">
                      Neeche{' '}
                      <span className="inline-flex items-center gap-0.5 bg-white border border-blue-200 px-1.5 py-0.5 rounded">
                        <Share2 size={10} className="text-blue-600" />
                        <span className="font-semibold"> Share ⬆️</span>
                      </span>{' '}
                      dabao → <strong>"Add to Home Screen"</strong> → <strong>"Add"</strong>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => dismiss()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Samajh Gaya
              </button>
            </>
          )}

          {/* ──────────── iPHONE + SAFARI (correct browser) ──────────── */}
          {platform === 'ios-safari' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                3 steps mein install karo — lead notifications WhatsApp ki tarah aayengi! 🔔
              </p>

              {/* Steps */}
              <div className="bg-green-50 rounded-xl p-4 mb-3">
                <p className="text-sm font-bold text-green-900 mb-3">Install karne ke steps:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-green-800 leading-5">
                      Neeche{' '}
                      <span className="inline-flex items-center gap-0.5 bg-white border border-green-200 px-1.5 py-0.5 rounded">
                        <Share2 size={10} className="text-green-700" />
                        <span className="font-semibold"> Share ⬆️</span>
                      </span>{' '}
                      button dabao
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-green-800 leading-5">
                      Thoda scroll karo aur <strong>"Add to Home Screen" 📱</strong> tap karo
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-green-800 leading-5">
                      Upar right corner mein <strong>"Add"</strong> tap karo — ho gaya! ✅
                    </p>
                  </div>
                </div>
              </div>

              {/* Chrome warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 mb-4 flex items-start gap-2">
                <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 leading-5">
                  <strong>Chrome se install mat karna</strong> — notifications sirf Safari se install karne pe kaam karengi
                </p>
              </div>

              <button
                onClick={() => dismiss()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Samajh Gaya
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}
