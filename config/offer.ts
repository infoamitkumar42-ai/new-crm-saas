/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  PROMOTIONAL OFFER CONFIG — single source of truth                 ║
 * ║                                                                    ║
 * ║  🔴 OFFER BAND KARNE KE LIYE: OFFER_ACTIVE = false kar do.         ║
 * ║     Poora UI (pricing cards, banner, landing page) apne aap        ║
 * ║     normal plans pe wapas aa jayega. Aur kuch nahi karna.          ║
 * ║                                                                    ║
 * ║  ⚠️  Ye sirf UI/marketing layer hai. Jo quota user ko actually     ║
 * ║     milta hai wo `functions/api/razorpay-webhook.ts` ke            ║
 * ║     PLAN_CONFIG se aata hai — dono ko saath mein badalna hai.      ║
 * ║     Poora runbook: OFFER-PLAYBOOK.md                               ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

/** Master switch — offer band karne ke liye isse false kar do. */
export const OFFER_ACTIVE = true;

export interface OfferPlanOverride {
  totalLeads: number;
  dailyLeads: number;
  replacementLimit: number;
  /** Normal (non-offer) total — UI mein struck-through dikhane ke liye */
  baseTotalLeads: number;
  /**
   * Optional — sirf tab set karo jab is plan ki offer-era pacing (dailyLeads)
   * base plan.duration se match na kare (e.g. manager 2026-08-16: base duration
   * 20 din hai par offer dailyLeads 27/din = 10 din ka pace). Jab set nahi ho,
   * UI base plan.duration hi use karta hai (jo baaki 4 plans ke liye already
   * offer-pace se consistent hai).
   */
  duration?: number;
}

export const OFFER = {
  id: 'august-2026',
  title: 'AUGUST MEGA OFFER',
  tagline: 'Same Price. Double Leads.',
  /** Marketing ke liye per-lead price */
  perLeadPrice: 11,
  /** Offer khatam hone ka time (IST). Banner isse countdown dikhata hai. */
  endsAt: '2026-08-15T23:59:59+05:30',

  /**
   * SABHI 5 plans pe offer hai. Har plan ka total = price ÷ ₹11 (round down).
   * Fresh count har plan mein unchanged hai — extra leads sirf recycled pool se.
   */
  plans: {
    starter: {
      baseTotalLeads: 50,
      totalLeads: 90,      // 999 / 11
      dailyLeads: 9,       // 90 / 10 din
      replacementLimit: 9,
    },
    supervisor: {
      baseTotalLeads: 80,
      totalLeads: 136,     // 1499 / 11
      dailyLeads: 11,      // 136 / 12 din
      replacementLimit: 13,
    },
    manager: {
      baseTotalLeads: 160,
      totalLeads: 272,     // 2999 / 11
      dailyLeads: 27,      // 272 / 10 din
      replacementLimit: 27,
      duration: 10,        // 2026-08-16: 20 din -> 10 din, daily pace 14 -> 27
    },
    weekly_boost: {
      baseTotalLeads: 92,
      totalLeads: 181,     // 1999 / 11
      dailyLeads: 26,      // 181 / 7 din
      replacementLimit: 18,
    },
    turbo_boost: {
      baseTotalLeads: 108,
      totalLeads: 227,     // 2499 / 11
      dailyLeads: 33,      // 227 / 7 din
      replacementLimit: 21,
    },
  } as Record<string, OfferPlanOverride>,
};

/** Offer abhi chal raha hai? (flag + end-date dono check karta hai) */
export const isOfferLive = (): boolean => {
  if (!OFFER_ACTIVE) return false;
  return Date.now() < new Date(OFFER.endsAt).getTime();
};

/**
 * Kisi plan ka offer override do — offer band ho, plan offer mein na ho, ya
 * endsAt nikal chuka ho to null.
 *
 * BUG FIX (2026-08-10): pehle ye sirf OFFER_ACTIVE check karta tha, endsAt
 * nahi — isliye endsAt nikalne ke baad bhi Subscription.tsx ki pricing cards
 * "AUGUST OFFER" badge + offer wale lead-counts dikhati rehti thi, jabki top
 * banner (jo isOfferLive() use karta hai) sahi se gayab ho jata tha. Ab dono
 * isOfferLive() se hi decide hote hain, taaki cards aur banner hamesha sync
 * mein rahein.
 */
export const getOfferForPlan = (planId: string): OfferPlanOverride | null => {
  if (!isOfferLive()) return null;
  return OFFER.plans[planId] ?? null;
};
