import React, { useEffect, useRef, useState } from 'react';
import { Target, Zap, Eye, Clock, ArrowRight } from 'lucide-react';

/**
 * STALE LEAD STATUS REMINDER
 *
 * Agents often just call/WhatsApp a lead and never come back to update its
 * status (Interested/Follow-up/Closed/etc). No status change means the
 * trg_send_crm_conversion DB trigger never fires, so Meta CAPI never gets a
 * quality signal for that lead — hurting ad optimization over time.
 *
 * v2 (2026-08-09, admin decision): upgraded from an instantly-dismissible
 * popup to a briefing card that locks the dismiss button for 5 seconds
 * (countdown ring + label) so the agent can't reflexively close it without
 * reading why this matters — there is deliberately NO other way to close it
 * early (no X button). This is still a SOFT nudge, not a hard block on new
 * leads: the daily lead-assignment RPCs are untouched. It reappears once per
 * IST day (date-scoped sessionStorage key) as long as staleCount stays above
 * 0, so dismissing today doesn't silence it forever.
 */

interface StaleLeadReminderProps {
  staleCount: number;
}

const LOCK_SECONDS = 5;
// Update this string manually when the deadline changes — there is no
// backend enforcement tied to it, it is informational copy only.
const DEADLINE_LABEL = 'Deadline: 10 Aug, 11:59 PM';

const RING_RADIUS = 9;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const StaleLeadReminder: React.FC<StaleLeadReminderProps> = ({ staleCount }) => {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const dismissKey = `stale_lead_reminder_dismissed_${todayIST}`;

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(dismissKey) === 'true';
    } catch {
      return false;
    }
  });

  const shouldShow = staleCount > 0 && !dismissed;

  const [secondsLeft, setSecondsLeft] = useState(LOCK_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!shouldShow) return;
    setSecondsLeft(LOCK_SECONDS);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow]);

  if (!shouldShow) return null;

  const ready = secondsLeft <= 0;
  const progress = (LOCK_SECONDS - secondsLeft) / LOCK_SECONDS;

  const handleDismiss = () => {
    if (!ready) return;
    try {
      sessionStorage.setItem(dismissKey, 'true');
    } catch (_) {
      // sessionStorage unavailable — non-critical, popup just won't persist dismissal
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header — dark gradient, centered */}
        <div
          className="px-6 pt-7 pb-6 text-center"
          style={{ background: 'radial-gradient(120% 160% at 50% -20%, #2b48c9 0%, #16215a 45%, #0b1330 100%)' }}
        >
          <div className="text-[10px] font-extrabold tracking-widest uppercase text-blue-300 mb-2">
            Why This Matters
          </div>
          <h3 className="text-white font-extrabold text-lg leading-snug">
            Better Updates. Better Leads.<br />More Deals Closed.
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6">
          <ul className="space-y-3 mb-4">
            <li className="flex gap-3 items-start">
              <span className="flex-none w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Target size={15} />
              </span>
              <span className="text-[13px] leading-relaxed text-slate-700 pt-1">
                Sahi status → <b className="text-slate-900 font-bold">better Meta signal</b> → higher lead quality → <b className="text-slate-900 font-bold">zyada deals close</b>
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-none w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Zap size={15} />
              </span>
              <span className="text-[13px] leading-relaxed text-slate-700 pt-1">
                Purani leads clear rakhoge → <b className="text-slate-900 font-bold">naye leads jaldi</b> milenge
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-none w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye size={15} />
              </span>
              <span className="text-[13px] leading-relaxed text-slate-700 pt-1">
                Company ko pata chalta hai kaunsi leads <b className="text-slate-900 font-bold">genuinely follow-up</b> ho rahi hain
              </span>
            </li>
          </ul>

          <div className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3 mb-3">
            <span className="text-[28px] font-extrabold tracking-tight tabular-nums text-blue-800 leading-none">
              {staleCount}
            </span>
            <span className="text-xs leading-snug text-slate-600">
              is month ki leads<br />status update ka wait kar rahi hain
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            <Clock size={12} />
            {DEADLINE_LABEL}
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400 mb-4 text-center">
            Sahi status chunein — jaldi mein galat status na daalein, quality ke liye zaroori hai.
          </p>

          <button
            onClick={handleDismiss}
            disabled={!ready}
            aria-live="polite"
            className={`w-full py-3.5 rounded-xl font-extrabold text-[14.5px] flex items-center justify-center gap-2.5 transition-all ${
              ready
                ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-600/30 active:scale-[0.98] cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {!ready && (
              <svg width="18" height="18" viewBox="0 0 22 22" className="flex-none">
                <circle cx="11" cy="11" r={RING_RADIUS} fill="none" stroke="#d7dbe8" strokeWidth="2.5" />
                <circle
                  cx="11" cy="11" r={RING_RADIUS} fill="none" stroke="#94a3b8" strokeWidth="2.5"
                  strokeLinecap="round" transform="rotate(-90 11 11)"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * progress}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
            )}
            {ready ? (
              <>
                Update Leads
                <ArrowRight size={16} />
              </>
            ) : (
              `Wait ${secondsLeft}s`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
