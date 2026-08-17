/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚦 PENDING LEADS GATE — blocks Call / WhatsApp until old leads are updated
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin decision 2026-08-16. Agents were receiving leads and never recording
 * an outcome: across Kulwinder's two teams, 1,014 leads had been delivered
 * and only 204 (20%) ever got a status. That makes the "numbers don't pick
 * up" complaint unmeasurable AND starves Meta CAPI of the QualifiedLead /
 * FollowUp signal that actually drives ad optimisation.
 *
 * HOW IT WORKS
 *   Agent taps Call or WhatsApp -> if they have any lead from THIS MONTH that
 *   is 24h+ old and still sitting at 'Assigned'/'Fresh', this modal opens
 *   with up to BATCH_SIZE of their OLDEST such leads. They set a status on
 *   each, hit save, and the original Call/WhatsApp action then runs.
 *
 * WHY IT IS CAPPED AT A SMALL BATCH (and not "clear everything")
 *   A zero-tolerance gate was measured against live data first: 37 of 38
 *   active members would have been blocked from calling ANYONE, with an
 *   average of ~50 un-updated leads each (worst case 247). That stops the
 *   whole business on day one, and pushes agents to mass-mark junk statuses
 *   just to unlock the button — which would give us FALSE data (worse than
 *   none) and pollute the CAPI signal. A small recurring batch is always
 *   clearable in under a minute, so work never stops, but it comes back the
 *   next day until the backlog is genuinely drained.
 *
 * ⚠️ 'Not Picked' is deliberately NOT counted as pending here, even though it
 *    IS counted by the (soft) stale-lead reminder. Reason: this gate BLOCKS
 *    work. If a genuinely unreachable lead kept re-appearing, an agent could
 *    be trapped behind it forever. The soft reminder is the right place to
 *    chase retries; a hard gate is not.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { AlertTriangle, Loader2, Phone } from 'lucide-react';
import { supabase } from '../supabaseClient';

/** How many of the oldest pending leads an agent must clear per unlock. */
export const GATE_BATCH_SIZE = 10;

/**
 * Users the gate never applies to — Call/WhatsApp always works for them.
 * Admin decision 2026-08-17: Himanshu Sharma is already a deliberate
 * special case elsewhere in this system (unlimited total_leads_promised,
 * his own hardcoded branch in sync_user_plan_fields), and admin does not
 * want him blocked. Keyed by user id, not email, so a display-name or
 * address change can't silently re-enable the gate for him.
 */
export const GATE_EXEMPT_USER_IDS = [
  '9dd68ace-a5a7-46d8-b677-3483b5bb0841', // sharmahimanshu9797@gmail.com
];

export interface PendingLead {
  id: string;
  name: string | null;
  phone: string;
  assigned_at: string | null;
}

interface PendingLeadsGateProps {
  leads: PendingLead[];
  totalPending: number;
  onCancel: () => void;
  /** Called once every shown lead has been given a status and saved. */
  onCleared: () => void;
}

const STATUS_OPTIONS = [
  { value: 'Contacted', label: '📞 Contacted' },
  { value: 'Not Picked', label: '📵 Not Picked' },
  { value: 'Call Back', label: '🔄 Call Back' },
  { value: 'Interested', label: '✅ Interested' },
  { value: 'Follow-up', label: '📅 Follow-up' },
  { value: 'Closed', label: '🎉 Closed' },
  { value: 'Rejected', label: '❌ Rejected' },
  { value: 'Invalid', label: '🚫 Invalid' },
];

const daysOld = (iso: string | null): string => {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'aaj';
  if (days === 1) return '1 din purani';
  return `${days} din purani`;
};

const PendingLeadsGate: React.FC<PendingLeadsGateProps> = ({
  leads, totalPending, onCancel, onCleared,
}) => {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doneCount = leads.filter(l => picked[l.id]).length;
  const allDone = doneCount === leads.length && leads.length > 0;

  const handleSave = async () => {
    if (!allDone || saving) return;
    setSaving(true);
    setError(null);

    try {
      // Sequential, not Promise.all: each UPDATE fires trg_send_crm_conversion
      // (which calls the CAPI edge function via pg_net). Firing 10 of those at
      // once is the same fan-out pattern that has caused races here before.
      for (const lead of leads) {
        const { error: updErr } = await supabase
          .from('leads')
          .update({ status: picked[lead.id], updated_at: new Date().toISOString() })
          .eq('id', lead.id);
        if (updErr) throw updErr;
      }
      onCleared();
    } catch (e: any) {
      setError(e?.message || 'Save nahi ho paya. Dobara try karo.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">

        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-lg leading-tight">
                Pehle purani leads update karo
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-snug">
                Aapki <strong className="text-slate-700">{totalPending}</strong> leads ka status abhi tak pending hai.
                In <strong className="text-slate-700">{leads.length}</strong> sabse purani ka status daalo, phir call kar sakte ho.
              </p>
            </div>
          </div>

          <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${leads.length ? (doneCount / leads.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{doneCount} / {leads.length} done</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`border rounded-2xl p-3 transition-colors ${
                picked[lead.id] ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{lead.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{lead.phone} · {daysOld(lead.assigned_at)}</p>
                </div>
                <a
                  href={`tel:${lead.phone}`}
                  className="shrink-0 flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg"
                >
                  <Phone size={13} /> Call
                </a>
              </div>
              <select
                value={picked[lead.id] || ''}
                onChange={(e) => setPicked(p => ({ ...p, [lead.id]: e.target.value }))}
                className="w-full bg-white border border-slate-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="" disabled>Status chuno…</option>
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 space-y-2">
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <button
            onClick={handleSave}
            disabled={!allDone || saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              allDone && !saving
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Save ho raha hai…' : allDone ? 'Save karke aage badho' : `${leads.length - doneCount} aur baaki`}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="w-full py-2.5 rounded-2xl font-medium text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            Abhi nahi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingLeadsGate;
