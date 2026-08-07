import React, { useState } from 'react';
import { ClipboardList, X } from 'lucide-react';

/**
 * STALE LEAD STATUS REMINDER
 *
 * Agents often just call/WhatsApp a lead and never come back to update its
 * status (Interested/Follow-up/Closed/etc). No status change means the
 * trg_send_crm_conversion DB trigger never fires, so Meta CAPI never gets a
 * quality signal for that lead — hurting ad optimization over time.
 *
 * This is a soft nudge (not a hard block on new leads): a dismissible popup
 * that reminds the agent how many leads still need an outcome. It reappears
 * once per IST day (via a date-scoped sessionStorage key) as long as
 * staleCount stays above 0, so dismissing today doesn't silence it forever.
 */

interface StaleLeadReminderProps {
  staleCount: number;
}

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

  if (staleCount <= 0 || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(dismissKey, 'true');
    } catch (_) {
      // sessionStorage unavailable — non-critical, popup just won't persist dismissal
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
          <ClipboardList size={28} className="text-amber-600" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {staleCount} Lead{staleCount > 1 ? 's' : ''} ka Status Update Pending
        </h3>
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          Aapke {staleCount} lead{staleCount > 1 ? 's' : ''} ka status abhi tak update nahi hua hai.
          Isse hum aapko behtar quality leads de payenge — please inhe update karein.
        </p>

        <button
          onClick={handleDismiss}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Theek Hai, Update Karta Hoon
        </button>
      </div>
    </div>
  );
};
