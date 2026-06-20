import React from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MessageCircle, 
  Zap, 
  Users, 
  BarChart3, 
  Shield, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  Facebook,
  Check
} from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/916283182767?text=Hi,%20main%20FLP%20team%20Manager%20hoon.%20LeadFlow%20ke%20baare%20mein%20batao.';

export const FlpDemoBooking: React.FC = () => {
  return (
    <>
      <Helmet>
        {/* 🚫 Block search engines to maintain internal obscurity */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>FLP Lead Distribution System — Free Demo</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Custom Styles for Mobile-First Optimizations */}
      <style dangerouslySetInnerHTML={{__html: `
        .font-jakarta {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-green-pulse {
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
          animation: pulse-btn 2s infinite;
        }
        @keyframes pulse-btn {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); }
          50% { transform: scale(1.02); box-shadow: 0 6px 25px rgba(16, 185, 129, 0.6); }
        }
        /* Hide scrollbars but keep functionality */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      <div className="font-jakarta min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center selection:bg-indigo-500 selection:text-white pb-32">
        
        {/* ── Outer Wrapper Centered for Desktop, Natural Mobile ── */}
        <div className="w-full max-w-md bg-white min-h-screen shadow-xl shadow-slate-200/50 border-x border-slate-100 flex flex-col justify-between relative">
          
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="LeadFlow CRM Logo" 
                className="w-10 h-10 object-contain rounded-xl shadow-md border border-slate-100"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-slate-950">
                  LeadFlow<span className="text-indigo-600">CRM</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Team Rotator</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Internal Only</span>
            </div>
          </header>

          {/* Main Hero & Content Area */}
          <main className="px-5 py-6 flex-1 flex flex-col space-y-6">
            
            {/* Top Tagline */}
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/60">
                <Sparkles size={14} className="text-indigo-600" />
                <span className="text-[10px] font-extrabold text-indigo-700 tracking-wider uppercase">
                  For FLP Team Managers
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 leading-tight">
                FLP Managers ke liye
                <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500">
                  Automatic Lead Distribution System
                </span>
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Apne Facebook Ads leads ko bina kisi manual kaam ke, automatic, fair rotation ke saath instantly poori team mein distribute karein.
              </p>
            </div>

            {/* ── Product Flow Mockup Card (Logo Themed) ── */}
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-extrabold text-slate-800 tracking-wide">LeadFlow Process Mockup</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Real-time</span>
              </div>

              {/* Graphical Process Path */}
              <div className="flex flex-col space-y-4">
                
                {/* Step 1: Facebook Source */}
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Facebook size={18} className="fill-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">Facebook Ads Leads</span>
                      <span className="text-[9px] text-slate-400">Instant API Webhook Sync</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>

                {/* Vertical Connector Path */}
                <div className="flex justify-center -my-2.5 h-6">
                  <div className="w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-indigo-600 h-full border-dashed" />
                </div>

                {/* Step 2: LeadFlow Router Hub */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-100/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                    <Zap size={18} className="text-white fill-white/10" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-slate-900">LeadFlow Rotator Engine</span>
                    <span className="text-[9px] text-slate-400">Fair Distribution Router v3.9</span>
                  </div>
                </div>

                {/* Vertical Connector Path */}
                <div className="flex justify-center -my-2.5 h-6">
                  <div className="w-0.5 bg-gradient-to-b from-indigo-600 to-purple-600 h-full border-dashed" />
                </div>

                {/* Step 3: Team Distribution Output */}
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Team Member</span>
                    <span>Received Leads</span>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { name: 'Kajal Kaur', role: 'FLP Manager', count: 18, color: 'bg-emerald-500' },
                      { name: 'Ranjit Singh', role: 'Team Leader', count: 24, color: 'bg-indigo-500' },
                      { name: 'Loveleen Kaur', role: 'Distributor', count: 15, color: 'bg-purple-500' }
                    ].map((member, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100/50">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${member.color}`} />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{member.name}</span>
                            <span className="text-[9px] text-slate-400">{member.role}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
                          {member.count} Leads
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Feature Bullet Points (Compact Mobile Layout) */}
            <div className="space-y-3 pt-2">
              {[
                {
                  icon: Zap,
                  title: 'Real-time Lead Assign',
                  desc: 'Meta ads se custom integration ke saath instant routing.',
                  color: 'text-indigo-600 bg-indigo-50'
                },
                {
                  icon: Users,
                  title: 'Fair Round Robin System',
                  desc: 'Kisi team member ke saath partiality nahi, equal share split.',
                  color: 'text-violet-600 bg-violet-50'
                },
                {
                  icon: BarChart3,
                  title: 'Manager Control Panel',
                  desc: 'Active/Inactive controls aur live lead status updates.',
                  color: 'text-purple-600 bg-purple-50'
                },
                {
                  icon: Shield,
                  title: '100% Secure & Verified',
                  desc: 'No duplicate lead sharing, client security complete priority.',
                  color: 'text-emerald-600 bg-emerald-50'
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/40 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <item.icon size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-sm text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </main>

          {/* Footer inside the card */}
          <footer className="px-5 py-6 bg-slate-50 border-t border-slate-100 text-center space-y-3">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              🔒 FLP INTERNAL CRM PLATFORM
            </p>
            <p className="text-[10px] text-slate-400">
              Authorized personnel only. Data encrypted via SSL.
            </p>
          </footer>

          {/* Sticky Bottom CTA Bar (Highly Converting for Mobile) */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 flex justify-center shadow-2xl">
            <div className="w-full max-w-md space-y-2">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-green-pulse flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-base transition-all transform active:scale-95"
              >
                <MessageCircle size={22} className="fill-white/10" />
                <span>Free Demo Book Karo — WhatsApp Pe Aao</span>
                <ChevronRight size={18} className="opacity-80" />
              </a>
              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>🟢 Auto-Setup Support</span>
                <span>•</span>
                <span>⚡ Instant Consultation</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default FlpDemoBooking;
