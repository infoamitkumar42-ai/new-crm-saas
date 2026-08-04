/**
 * OfferBanner — promotional offer banner for the member dashboard.
 *
 * Offer band karne ke liye config/offer.ts mein OFFER_ACTIVE = false kar do —
 * ye component apne aap null return karega, koi aur change nahi chahiye.
 * Offer ki end-date nikal jane par bhi apne aap gayab ho jata hai.
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { isOfferLive, OFFER } from '../config/offer';

const DISMISS_KEY = `offer_banner_dismissed_${OFFER.id}`;

interface OfferBannerProps {
  onUpgrade?: () => void;
}

const formatCountdown = (msLeft: number): string => {
  const totalMinutes = Math.max(0, Math.floor(msLeft / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

export const OfferBanner: React.FC<OfferBannerProps> = ({ onUpgrade }) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [msLeft, setMsLeft] = useState<number>(
    () => new Date(OFFER.endsAt).getTime() - Date.now()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setMsLeft(new Date(OFFER.endsAt).getTime() - Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!isOfferLive() || dismissed || msLeft <= 0) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — dismiss is session-only, fine */
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 shadow-lg">
      {/* decorative glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

      <button
        onClick={handleDismiss}
        aria-label="Offer band karo"
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition"
      >
        <X size={16} />
      </button>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-amber-300 shrink-0" />
          <span className="text-amber-300 text-xs font-black tracking-widest">{OFFER.title}</span>
        </div>

        <h3 className="text-white text-lg sm:text-xl font-black leading-tight mb-1">
          {OFFER.tagline}
        </h3>
        <p className="text-white/80 text-xs sm:text-sm mb-3">
          Sirf <span className="font-black text-white">₹{OFFER.perLeadPrice}/lead</span> — har plan mein
          zyada leads, price same.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-1.5 bg-white text-indigo-700 text-sm font-black px-4 py-2 rounded-xl shadow hover:bg-indigo-50 active:scale-95 transition"
          >
            Offer Dekho
            <ArrowRight size={15} className="shrink-0" />
          </button>

          <span className="inline-flex items-center gap-1.5 bg-red-500/90 text-white text-xs font-bold px-3 py-2 rounded-xl">
            ⏳ {formatCountdown(msLeft)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfferBanner;
