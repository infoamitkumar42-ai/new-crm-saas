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
}

export const OFFER = {
  id: 'august-2026',
  title: 'AUGUST MEGA OFFER',
  tagline: 'Same Price. Double Leads.',
  /** Marketing ke liye per-lead price */
  perLeadPrice: 11,
  /** Offer khatam hone ka time (IST). Banner isse countdown dikhata hai. */
  endsAt: '2026-08-06T23:59:59+05:30',

  /** Sirf top-3 selling plans pe offer hai. Manager + Turbo Boost normal rahenge. */
  plans: {
    starter: {
      baseTotalLeads: 50,
      totalLeads: 90,
      dailyLeads: 9,
      replacementLimit: 9,
    },
    supervisor: {
      baseTotalLeads: 80,
      totalLeads: 136,
      dailyLeads: 11,
      replacementLimit: 13,
    },
    weekly_boost: {
      baseTotalLeads: 92,
      totalLeads: 181,
      dailyLeads: 26,
      replacementLimit: 18,
    },
  } as Record<string, OfferPlanOverride>,
};

/** Kisi plan ka offer override do — offer band ho ya plan offer mein na ho to null. */
export const getOfferForPlan = (planId: string): OfferPlanOverride | null => {
  if (!OFFER_ACTIVE) return null;
  return OFFER.plans[planId] ?? null;
};

/** Offer abhi chal raha hai? (flag + end-date dono check karta hai) */
export const isOfferLive = (): boolean => {
  if (!OFFER_ACTIVE) return false;
  return Date.now() < new Date(OFFER.endsAt).getTime();
};
