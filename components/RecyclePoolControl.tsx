/**
 * RECYCLE POOL CONTROL — admin panel (2026-08-10)
 *
 * Do cheezein deta hai:
 *   1. Recycled lead pool ka soft ON/OFF switch + per-user-per-day cap.
 *      Ye seedha `system_config.recycled_pool_control` row par likhta hai,
 *      jise `assign-recycled-leads` edge function har run par padhta hai.
 *   2. Har active user ka aaj ka smart view — daily limit, aaj kitni deliver
 *      hui (fresh/recycled split), kitni bachi hai, aur lifetime quota.
 *
 * ⚠️ IMPORTANT — SILENT-FAILURE GUARD:
 * `system_config` par RLS enabled hai aur pehle uspar ZERO policies thi,
 * yaani frontend usse na padh sakta tha na likh sakta tha. Iske liye do
 * scoped policies add ki gayi hain (migration
 * 20260810120000_add_recycled_pool_control_config.sql) jo sirf
 * config_key='recycled_pool_control' par, sirf is_admin() ke liye kaam karti
 * hain. Phir bhi — save karne ke baad ye component value ko DOBARA padhta hai
 * aur confirm karta hai ki wo sach mein persist hui. Agar RLS ya kuch aur
 * chupchaap block kar de to error dikhega, jhoota "Saved" kabhi nahi.
 *
 * Ye component sirf recycled leads ko control karta hai. Fresh lead
 * distribution (meta-webhook / sheet-lead-intake / process-backlog /
 * get_best_assignee_for_team) isse bilkul alag hai aur kabhi affect nahi hota.
 *
 * Counters (leads_today / total_leads_received) par bharosa NAHI kiya gaya —
 * CLAUDE.md ke DATABASE REPORTING RULES ke hisab se aaj ke numbers `leads`
 * table se actual count karke nikale jaate hain.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Recycle, RefreshCw, Power, AlertTriangle, CheckCircle2, Loader2, Info,
} from 'lucide-react';

const CONFIG_KEY = 'recycled_pool_control';
const MIN_CAP = 1;
const MAX_CAP = 5;

interface PoolConfig {
  enabled: boolean;
  max_per_user_per_day: number;
  allowed_team_codes: string[];
}

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  team_code: string | null;
  plan_name: string | null;
  daily_limit: number | null;
  daily_limit_override: number | null;
  total_leads_promised: number | null;
  total_leads_received: number | null;
  recycled_leads_quota: number | null;
  recycled_leads_received: number | null;
  is_online: boolean | null;
}

interface UserDailyRow extends UserRow {
  effectiveLimit: number;
  freshToday: number;
  recycledToday: number;
  deliveredToday: number;
  remainingToday: number;
  lifetimeRemaining: number;
}

/** Aaj ki IST date ka start, ISO mein — leads query ke liye. */
const startOfTodayIstIso = (): string => {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return new Date(`${todayIST}T00:00:00+05:30`).toISOString();
};

export const RecyclePoolControl: React.FC = () => {
  const [config, setConfig] = useState<PoolConfig | null>(null);
  const [users, setUsers] = useState<UserDailyRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);

  // ── Data load ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setError(null);
    try {
      const startIso = startOfTodayIstIso();

      const [cfgRes, usersRes, leadsRes] = await Promise.all([
        supabase
          .from('system_config')
          .select('config_value')
          .eq('config_key', CONFIG_KEY)
          .maybeSingle(),
        supabase
          .from('users')
          .select('id, name, email, team_code, plan_name, daily_limit, daily_limit_override, total_leads_promised, total_leads_received, recycled_leads_quota, recycled_leads_received, is_online')
          .eq('role', 'member')
          .eq('is_active', true),
        supabase
          .from('leads')
          .select('assigned_to, lead_type')
          .gte('assigned_at', startIso)
          .not('assigned_to', 'is', null)
          .limit(10000),
      ]);

      if (cfgRes.error) throw new Error(`Config read: ${cfgRes.error.message}`);
      if (usersRes.error) throw new Error(`Users read: ${usersRes.error.message}`);
      if (leadsRes.error) throw new Error(`Leads read: ${leadsRes.error.message}`);

      // Config row na mile to bhi UI ko toota hua nahi dikhana — safe
      // defaults (OFF) dikhao, aur save karne par row update ho jayegi.
      const raw = (cfgRes.data?.config_value ?? {}) as Partial<PoolConfig>;
      setConfig({
        enabled: raw.enabled === true,
        max_per_user_per_day: Number(raw.max_per_user_per_day) > 0 ? Number(raw.max_per_user_per_day) : 3,
        allowed_team_codes: Array.isArray(raw.allowed_team_codes) ? raw.allowed_team_codes : [],
      });

      // Aaj ke leads ko user-wise fresh/recycled mein baanto.
      const freshMap = new Map<string, number>();
      const recycledMap = new Map<string, number>();
      for (const row of (leadsRes.data || []) as { assigned_to: string; lead_type: string | null }[]) {
        const target = row.lead_type === 'recycled' ? recycledMap : freshMap;
        target.set(row.assigned_to, (target.get(row.assigned_to) || 0) + 1);
      }

      const rows: UserDailyRow[] = ((usersRes.data || []) as UserRow[]).map((u) => {
        const effectiveLimit = u.daily_limit_override || u.daily_limit || 0;
        const freshToday = freshMap.get(u.id) || 0;
        const recycledToday = recycledMap.get(u.id) || 0;
        const deliveredToday = freshToday + recycledToday;
        return {
          ...u,
          effectiveLimit,
          freshToday,
          recycledToday,
          deliveredToday,
          remainingToday: Math.max(effectiveLimit - deliveredToday, 0),
          lifetimeRemaining: Math.max((u.total_leads_promised || 0) - (u.total_leads_received || 0), 0),
        };
      });

      rows.sort((a, b) => b.deliveredToday - a.deliveredToday || (a.name || a.email).localeCompare(b.name || b.email));
      setUsers(rows);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Save (with read-back verification) ─────────────────────────────────
  const persist = async (next: PoolConfig) => {
    setSaving(true);
    setError(null);
    setSavedNote(null);

    try {
      const { error: updErr } = await supabase
        .from('system_config')
        .update({ config_value: next })
        .eq('config_key', CONFIG_KEY);

      if (updErr) throw new Error(updErr.message);

      // Read-back: RLS chupchaap 0 rows update kar sakti hai bina error ke.
      // Isliye value dobara padh kar confirm karte hain — warna "Saved"
      // dikhana jhoot hoga.
      const { data: check, error: checkErr } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .maybeSingle();

      if (checkErr) throw new Error(`Verify read: ${checkErr.message}`);

      const saved = (check?.config_value ?? {}) as Partial<PoolConfig>;
      const ok =
        saved.enabled === next.enabled &&
        Number(saved.max_per_user_per_day) === next.max_per_user_per_day;

      if (!ok) {
        throw new Error(
          'Change save nahi hua (database ne update accept nahi kiya). ' +
          'Ye aksar RLS permission ki wajah se hota hai — koi change apply nahi hua.'
        );
      }

      setConfig({
        enabled: saved.enabled === true,
        max_per_user_per_day: Number(saved.max_per_user_per_day),
        allowed_team_codes: Array.isArray(saved.allowed_team_codes) ? saved.allowed_team_codes : [],
      });
      setSavedNote(next.enabled ? 'Pool ON — verified' : 'Pool OFF — verified');
      window.setTimeout(() => setSavedNote(null), 4000);
    } catch (e: any) {
      setError(e.message || String(e));
      // Sach dikhane ke liye server se dobara load karo.
      load();
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    return users.reduce(
      (acc, u) => ({
        limit: acc.limit + u.effectiveLimit,
        fresh: acc.fresh + u.freshToday,
        recycled: acc.recycled + u.recycledToday,
        remaining: acc.remaining + u.remainingToday,
      }),
      { limit: 0, fresh: 0, recycled: 0, remaining: 0 }
    );
  }, [users]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-3 text-slate-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Recycle pool status load ho raha hai…</span>
      </div>
    );
  }

  const enabled = config?.enabled === true;
  const cap = config?.max_per_user_per_day ?? 3;
  const teams = config?.allowed_team_codes ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center ${
            enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}>
            <Recycle size={19} />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 leading-tight">Recycle Pool Control</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recycled leads ka master switch — fresh leads par koi asar nahi padta
            </p>
          </div>
        </div>

        <button
          onClick={load}
          className="flex-none p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="mx-5 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertTriangle size={15} className="text-red-500 flex-none mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">{error}</p>
        </div>
      )}
      {savedNote && (
        <div className="mx-5 mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
          <CheckCircle2 size={15} className="text-emerald-600 flex-none" />
          <p className="text-xs text-emerald-700 font-semibold">{savedNote}</p>
        </div>
      )}

      {/* ── Switch + cap ── */}
      <div className="p-5 space-y-4">
        <div className={`rounded-xl border p-4 ${
          enabled ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Power size={15} className={enabled ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="font-bold text-sm text-slate-900">
                  {enabled ? 'Pool ON' : 'Pool OFF'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {enabled
                  ? `Har eligible user ko roz max ${cap} recycled lead mil sakti hai.`
                  : 'Abhi sirf fresh leads ja rahi hain. Recycled pool band hai.'}
              </p>
            </div>

            <button
              onClick={() => persist({
                enabled: !enabled,
                max_per_user_per_day: cap,
                allowed_team_codes: teams,
              })}
              disabled={saving}
              role="switch"
              aria-checked={enabled}
              aria-label="Recycle pool on/off"
              className={`relative flex-none w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
                enabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all flex items-center justify-center ${
                enabled ? 'left-7' : 'left-1'
              }`}>
                {saving && <Loader2 size={12} className="animate-spin text-slate-400" />}
              </span>
            </button>
          </div>

          {/* Per-day cap */}
          <div className="mt-4 pt-4 border-t border-slate-200/70">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold text-slate-700">Per user, per day</span>
              <span className="text-xs text-slate-500">{cap} lead{cap > 1 ? 's' : ''}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_CAP - MIN_CAP + 1 }, (_, i) => i + MIN_CAP).map((n) => (
                <button
                  key={n}
                  onClick={() => persist({
                    enabled,
                    max_per_user_per_day: n,
                    allowed_team_codes: teams,
                  })}
                  disabled={saving}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 ${
                    n === cap
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Allowed teams — read-only, SQL se badalta hai */}
          <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
            <Info size={12} className="flex-none mt-0.5" />
            <span>
              Sirf in teams ko recycled leads jaati hain:{' '}
              <b className="text-slate-700">{teams.length ? teams.join(', ') : '— (koi nahi, pool effectively OFF)'}</b>.
              Simar ke managed users hamesha excluded hain.
            </span>
          </div>
        </div>

        {/* ── Aaj ka summary ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Daily Limit', value: totals.limit, tone: 'text-slate-900' },
            { label: 'Fresh Aaj', value: totals.fresh, tone: 'text-blue-600' },
            { label: 'Recycled Aaj', value: totals.recycled, tone: 'text-amber-600' },
            { label: 'Bachi Hui', value: totals.remaining, tone: 'text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-lg px-2 py-2.5 text-center">
              <div className={`text-lg font-extrabold tabular-nums leading-none ${s.tone}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowUsers((v) => !v)}
          className="w-full py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          {showUsers ? 'User details chhupao' : `User-wise details dekho (${users.length})`}
        </button>

        {/* ── Per-user table ── */}
        {showUsers && (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-semibold">User</th>
                  <th className="py-2 px-2 font-semibold text-center">Limit</th>
                  <th className="py-2 px-2 font-semibold text-center">Fresh</th>
                  <th className="py-2 px-2 font-semibold text-center">Recycled</th>
                  <th className="py-2 px-2 font-semibold text-center">Total</th>
                  <th className="py-2 px-2 font-semibold text-center">Bachi</th>
                  <th className="py-2 pl-2 font-semibold text-center">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const full = u.effectiveLimit > 0 && u.deliveredToday >= u.effectiveLimit;
                  return (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-3 max-w-[190px]">
                        <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-none ${u.is_online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {u.name || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {u.team_code || 'no team'} · {u.plan_name || 'no plan'}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center tabular-nums text-slate-700">{u.effectiveLimit}</td>
                      <td className="py-2 px-2 text-center tabular-nums text-blue-600 font-semibold">{u.freshToday}</td>
                      <td className="py-2 px-2 text-center tabular-nums text-amber-600 font-semibold">{u.recycledToday}</td>
                      <td className="py-2 px-2 text-center tabular-nums font-bold text-slate-900">{u.deliveredToday}</td>
                      <td className={`py-2 px-2 text-center tabular-nums font-semibold ${full ? 'text-red-500' : 'text-emerald-600'}`}>
                        {full ? 'Full' : u.remainingToday}
                      </td>
                      <td className="py-2 pl-2 text-center tabular-nums text-slate-500">{u.lifetimeRemaining}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
              Aaj ke numbers `leads` table se actual count kiye jaate hain (leads_today counter par
              bharosa nahi kiya jaata). Lifetime = total_leads_promised − total_leads_received.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecyclePoolControl;
