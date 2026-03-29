// ─────────────────────────────────────────────────────────────────────────────
// PwaInstallPrompt.tsx
// Module-level deferredPrompt capture (MUST be outside component so the event
// isn't missed before React mounts).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Download, X, Share2 } from 'lucide-react';
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

// ── Component ─────────────────────────────────────────────────────────────────
export function PwaInstallPrompt() {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null);
  const [show, setShow] = useState(false); // controls slide-in animation

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAlreadyInstalled()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS()) {
      // iOS: always show instructions (no beforeinstallprompt on iOS)
      setPlatform('ios');
      setVisible(true);
      setTimeout(() => setShow(true), 50);
    } else {
      // Android/Chrome: wait briefly for deferredPrompt to be captured
      const check = () => {
        if (deferredPrompt) {
          setPlatform('android');
          setVisible(true);
          setTimeout(() => setShow(true), 50);
        }
      };
      // Check immediately (already captured) and also after 2s
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
    setTimeout(() => setVisible(false), 300); // wait for slide-out
    if (permanent) {
      // Installed — use localStorage so it never appears again
      localStorage.setItem('pwa-installed', 'true');
    } else {
      // "Baad mein" — sessionStorage only, reappears next login
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    }
  };

  if (!visible) return null;
  // Also skip if already installed (permanent dismiss)
  if (localStorage.getItem('pwa-installed')) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[9998]"
        onClick={() => dismiss()}
      />

      {/* Popup */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[9999] flex justify-center transition-transform duration-300 ease-out ${
          show ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl px-5 pt-5 pb-8">

          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

          {/* Close button */}
          <button
            onClick={() => dismiss()}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* App icon + Title */}
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

          {/* Subtitle */}
          <p className="text-sm text-gray-600 mb-4">
            Faster loading, instant lead notifications, aur better experience ke liye app install karo
          </p>

          {/* ── Android: one big install button ── */}
          {platform === 'android' && (
            <button
              onClick={handleInstall}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-base"
            >
              <Download size={18} />
              App Install Karo
            </button>
          )}

          {/* ── iOS: instructions ── */}
          {platform === 'ios' && (
            <div className="mb-4">
              <div className="bg-indigo-50 rounded-xl p-4 mb-3">
                <p className="text-sm text-indigo-900 font-medium mb-2">
                  Install karne ke steps:
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm border border-indigo-100">
                      <Share2 size={18} className="text-indigo-600" />
                    </div>
                    <p className="text-[10px] text-indigo-600 font-medium">Share</p>
                  </div>
                  <div className="flex-1 text-xs text-indigo-800 leading-5 mt-1">
                    <span className="font-semibold">1.</span> Neeche Share button{' '}
                    <span className="inline-flex items-center gap-0.5 bg-indigo-100 px-1 rounded">
                      <Share2 size={10} className="text-indigo-700" /> ⬆️
                    </span>{' '}
                    dabao
                    <br />
                    <span className="font-semibold">2.</span> "Add to Home Screen" select karo
                    <br />
                    <span className="font-semibold">3.</span> "Add" tap karo — ho gaya! ✅
                  </div>
                </div>
              </div>

              <button
                onClick={() => dismiss()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Samajh Gaya
              </button>
            </div>
          )}

          {/* Baad Mein (common dismiss for both) */}
          {platform === 'android' && (
            <button
              onClick={() => dismiss()}
              className="w-full text-gray-400 text-sm mt-3 py-1"
            >
              Baad Mein
            </button>
          )}
        </div>
      </div>
    </>
  );
}
