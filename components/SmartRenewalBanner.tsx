import React, { useMemo } from 'react';
import {
    AlertTriangle, TrendingUp, Clock, Zap, Users, ArrowUp
} from 'lucide-react';

/**
 * SMART RENEWAL BANNER - With Upgrade Push & Social Proof
 * 
 * ACTUAL PLANS:
 * - Starter: ₹999, 10 days, 5/day, 55 total
 * - Supervisor: ₹1999, 15 days, 7/day, 105 total
 * - Manager: ₹2999, 20 days, 8/day, 160 total
 * - Weekly Boost: ₹1999, 7 days, 12/day, 84 total
 * - Turbo Boost: ₹2499, 7 days, 14/day, 98 total
 * 
 * UPGRADE STRATEGY:
 * - Starter → Weekly Boost (₹999 → ₹1999, more leads/day)
 * - Supervisor → Weekly Boost (same ₹1999, more leads/day, faster repeat)
 * - Manager → Stay or Turbo (already good)
 */

interface RenewalBannerProps {
    daysLeft: number | null;
    totalLeadsReceived: number;
    interestedLeads: number;
    closedDeals: number;
    userName: string;
    planName: string;
    onRenew: () => void;
    onDismiss?: () => void;
}

export const SmartRenewalBanner: React.FC<RenewalBannerProps> = ({
    daysLeft,
    totalLeadsReceived,
    interestedLeads,
    closedDeals,
    userName,
    planName,
    onRenew,
    onDismiss
}) => {
    // Don't show if more than 5 days left
    if (daysLeft === null || daysLeft > 5) return null;

    const currentPlan = planName?.toLowerCase() || 'starter';

    // Show upgrade for starter and supervisor
    const showUpgrade = currentPlan === 'starter' || currentPlan === 'supervisor';

    // Determine urgency level
    const urgencyLevel = useMemo(() => {
        if (daysLeft <= 0) return 'expired';
        if (daysLeft === 1) return 'critical';
        if (daysLeft <= 3) return 'urgent';
        return 'reminder';
    }, [daysLeft]);

    // Upgrade message based on current plan
    const getUpgradeMessage = () => {
        if (currentPlan === 'starter') {
            return {
                title: 'Weekly Boost - ₹1999',
                subtitle: '12 leads/day × 7 days = 84 leads',
                benefit: 'Zyada leads, zyada conversions. Weekly plan users better results la rahe hain.',
                tag: 'RECOMMENDED'
            };
        }
        if (currentPlan === 'supervisor') {
            return {
                title: 'Weekly Boost - ₹1999 (Same Price!)',
                subtitle: '12 leads/day × 7 days = 84 leads',
                benefit: 'Same price mein 5 extra leads per day. Weekly users zyada conversions la rahe hain.',
                tag: 'SAME PRICE, MORE LEADS'
            };
        }
        return null;
    };

    const upgrade = showUpgrade ? getUpgradeMessage() : null;

    // Content based on urgency
    const content = useMemo(() => {
        const firstName = userName?.split(' ')[0] || 'User';

        if (urgencyLevel === 'expired') {
            return {
                icon: AlertTriangle,
                bgGradient: 'from-red-600 to-red-700',
                borderColor: 'border-red-400',
                title: `${firstName}, Leads Stopped`,
                subtitle: interestedLeads > 0
                    ? `${interestedLeads} interested leads pending follow-up`
                    : 'Renew to continue receiving leads',
                socialProof: 'Team members abhi bhi leads le rahe hain',
                ctaText: 'Resume Leads',
                ctaBg: 'bg-white text-red-600 hover:bg-red-50',
                badge: 'EXPIRED'
            };
        }

        if (urgencyLevel === 'critical') {
            return {
                icon: Clock,
                bgGradient: 'from-orange-500 to-red-500',
                borderColor: 'border-orange-400',
                title: `Last Day - Expires Tonight`,
                subtitle: `Kal se leads nahi aayengi`,
                socialProof: 'Aaj 8 members ne renewal kiya',
                ctaText: 'Renew Now',
                ctaBg: 'bg-white text-orange-600 hover:bg-orange-50',
                badge: 'EXPIRES TODAY'
            };
        }

        if (urgencyLevel === 'urgent') {
            return {
                icon: Clock,
                bgGradient: 'from-amber-500 to-orange-500',
                borderColor: 'border-amber-400',
                title: `${daysLeft} Days Left`,
                subtitle: `Your ${planName} plan expires soon`,
                socialProof: 'Active members daily leads le rahe hain',
                ctaText: 'Renew',
                ctaBg: 'bg-white text-amber-600 hover:bg-amber-50',
                badge: `${daysLeft} DAYS`
            };
        }

        // Reminder (4-5 days)
        return {
            icon: TrendingUp,
            bgGradient: 'from-blue-500 to-indigo-500',
            borderColor: 'border-blue-400',
            title: `Plan Expiring Soon`,
            subtitle: `${daysLeft} days remaining`,
            socialProof: '',
            ctaText: 'Renew Early',
            ctaBg: 'bg-white text-blue-600 hover:bg-blue-50',
            badge: 'REMINDER'
        };
    }, [urgencyLevel, userName, interestedLeads, daysLeft, planName]);

    const IconComponent = content.icon;

    return (
        <div className="space-y-3 mb-4">
            {/* Main Renewal Banner */}
            <div className={`
        relative overflow-hidden rounded-xl bg-gradient-to-r ${content.bgGradient} 
        border ${content.borderColor} shadow-lg
      `}>
                <div className="relative p-4">
                    {/* Dismiss button */}
                    {onDismiss && urgencyLevel !== 'expired' && (
                        <button
                            onClick={onDismiss}
                            className="absolute top-2 right-2 text-white/60 hover:text-white text-lg leading-none"
                        >
                            ×
                        </button>
                    )}

                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`
              flex-shrink-0 w-12 h-12 rounded-xl bg-white/20
              flex items-center justify-center
              ${urgencyLevel === 'expired' ? 'animate-pulse' : ''}
            `}>
                            <IconComponent className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                                    {content.badge}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white truncate">
                                {content.title}
                            </h3>
                            <p className="text-white/80 text-sm truncate">
                                {content.subtitle}
                            </p>

                            {/* Social Proof Line */}
                            {content.socialProof && (
                                <div className="flex items-center gap-1.5 mt-2 text-white/70 text-xs">
                                    <Users className="w-3 h-3" />
                                    <span>{content.socialProof}</span>
                                </div>
                            )}
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={onRenew}
                            className={`
                flex-shrink-0 ${content.ctaBg} px-4 py-2 rounded-lg font-semibold text-sm
                shadow hover:shadow-md transition-all
                flex items-center gap-1.5
              `}
                        >
                            {content.ctaText}
                            <Zap className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Stats - Only show if expired and has data */}
                    {totalLeadsReceived > 0 && urgencyLevel === 'expired' && (
                        <div className="mt-3 pt-3 border-t border-white/20 flex gap-4 text-center">
                            <div className="flex-1">
                                <div className="text-lg font-bold text-white">{totalLeadsReceived}</div>
                                <div className="text-[10px] text-white/60 uppercase">Total</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-bold text-green-300">{closedDeals}</div>
                                <div className="text-[10px] text-white/60 uppercase">Closed</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-bold text-yellow-300">{interestedLeads}</div>
                                <div className="text-[10px] text-white/60 uppercase">Interested</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* UPGRADE SUGGESTION - Only for Starter/Supervisor users when expired or critical */}
            {upgrade && (urgencyLevel === 'expired' || urgencyLevel === 'critical') && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <ArrowUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                    {upgrade.tag}
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">
                                {upgrade.title}
                            </h4>
                            <p className="text-slate-500 text-xs mt-0.5">
                                {upgrade.subtitle}
                            </p>
                            <p className="text-slate-600 text-xs mt-1">
                                {upgrade.benefit}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Compact version for sidebar/header
export const CompactRenewalAlert: React.FC<{
    daysLeft: number | null;
    onRenew: () => void;
}> = ({ daysLeft, onRenew }) => {
    if (daysLeft === null || daysLeft > 5) return null;

    const isExpired = daysLeft <= 0;
    const isCritical = daysLeft === 1;

    return (
        <button
            onClick={onRenew}
            className={`
        w-full px-3 py-2 rounded-lg font-medium text-sm
        flex items-center justify-between
        transition-all
        ${isExpired
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : isCritical
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }
      `}
        >
            <span className="flex items-center gap-2">
                {isExpired ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {isExpired ? 'Plan Expired' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
            </span>
            <span className="text-xs font-bold">RENEW →</span>
        </button>
    );
};

export default SmartRenewalBanner;
