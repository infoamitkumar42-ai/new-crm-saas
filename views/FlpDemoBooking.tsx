import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Zap, Users, BarChart3, Shield, ArrowRight, Sparkles } from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/916283182767?text=Hi,%20main%20FLP%20team%20Manager%20hoon.%20LeadFlow%20ke%20baare%20mein%20batao.';

export const FlpDemoBooking: React.FC = () => {
  return (
    <>
      <Helmet>
        {/* 🚫 Block ALL search engines — this page is internal-only */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Free Demo — LeadFlow CRM</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">

        {/* ── Ambient Background Glow ── */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg">

          {/* ── Top Badge ── */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
              <Sparkles size={16} className="text-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-bold tracking-wider uppercase">
                FLP Managers ke liye
              </span>
            </div>
          </div>

          {/* ── Main Card ── */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-black text-white text-center leading-tight mb-2">
              FLP Managers ke liye
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 mt-1">
                Automatic Lead Distribution System
              </span>
            </h1>
            <p className="text-white/40 text-center text-sm mb-8">
              Aapki team ko daily fresh leads — bina kisi manual kaam ke
            </p>

            {/* ── Feature Bullets ── */}
            <div className="space-y-4 mb-10">
              {[
                {
                  icon: Zap,
                  color: 'text-yellow-400',
                  bg: 'bg-yellow-500/10',
                  text: 'Meta Ads se automatically leads aati hain — real-time',
                },
                {
                  icon: Users,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                  text: 'Har team member ko fair rotation se leads milti hain',
                },
                {
                  icon: BarChart3,
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10',
                  text: 'Dashboard se poori team ki performance track karo',
                },
                {
                  icon: Shield,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10',
                  text: '100% exclusive leads — koi sharing ya duplicate nahi',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <p className="text-white/80 text-sm font-medium leading-relaxed pt-1.5">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* ── WhatsApp CTA Button ── */}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg shadow-xl shadow-green-500/25 hover:shadow-green-500/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <MessageCircle size={24} className="group-hover:animate-bounce" />
              <span>Free Demo Book Karo</span>
              <ArrowRight size={20} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </a>

            <p className="text-center text-white/30 text-xs mt-4">
              WhatsApp pe seedha baat karo — koi form nahi, koi wait nahi
            </p>

          </div>

          {/* ── Trust Footer ── */}
          <div className="mt-6 flex items-center justify-center gap-6 text-white/20 text-xs">
            <span>🔒 100% Private</span>
            <span>•</span>
            <span>⚡ Instant Reply</span>
            <span>•</span>
            <span>🆓 Free Consultation</span>
          </div>

        </div>
      </div>
    </>
  );
};

export default FlpDemoBooking;
