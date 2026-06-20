import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MessageCircle, 
  Zap, 
  Users, 
  BarChart3, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  TrendingUp, 
  ChevronRight,
  UserCheck
} from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/916283182767?text=Hi,%20main%20FLP%20team%20Manager%20hoon.%20LeadFlow%20ke%20baare%20mein%20batao.';

interface Member {
  name: string;
  role: string;
  count: number;
  color: string;
  glow: string;
}

export const FlpDemoBooking: React.FC = () => {
  // Simulator State
  const [members, setMembers] = useState<Member[]>([
    { name: 'Kajal Kaur', role: 'FLP Manager', count: 18, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    { name: 'Ranjit Singh', role: 'Team Leader', count: 24, color: 'text-blue-400', glow: 'shadow-blue-500/20' },
    { name: 'Loveleen Kaur', role: 'Distributor', count: 15, color: 'text-purple-400', glow: 'shadow-purple-500/20' }
  ]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [activeMemberIndex, setActiveMemberIndex] = useState<number>(0);
  const [lastDeliveredIndex, setLastDeliveredIndex] = useState<number | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<boolean>(true); // running
  const [totalLeadsRouted, setTotalLeadsRouted] = useState<number>(57);

  useEffect(() => {
    if (!simulationSpeed) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev === 3) {
          // Deliver lead
          setMembers((prevMembers) => {
            const next = [...prevMembers];
            next[activeMemberIndex].count += 1;
            return next;
          });
          setLastDeliveredIndex(activeMemberIndex);
          setTotalLeadsRouted(prev => prev + 1);
          
          // Clear delivery indicator after a brief duration
          setTimeout(() => {
            setLastDeliveredIndex(null);
          }, 1000);

          // Move to next member
          setActiveMemberIndex((prevIndex) => (prevIndex + 1) % members.length);
          return 0; // Reset step
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeMemberIndex, simulationSpeed, members.length]);

  return (
    <>
      <Helmet>
        {/* 🚫 Block search engines to maintain internal obscurity */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>FLP Lead Distribution System — Free Demo</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Custom Styles for Advanced Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .font-jakarta {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.4; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes beam-flow {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes float-particle {
          0% { transform: translateY(0px) scale(0.8); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-80px) scale(0.4); opacity: 0; }
        }
        .anim-float {
          animation: float-slow 6s ease-in-out infinite;
        }
        .anim-float-delayed {
          animation: float-slow 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        .btn-glow {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          animation: pulse-btn 2s infinite;
        }
        @keyframes pulse-btn {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.7); }
        }
      `}} />

      <div className="font-jakarta min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-slate-900">
        
        {/* ── Background Mesh Gradients ── */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[150px]" />
          <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[120px]" />
          
          {/* Subtle grid lines background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
        </div>

        {/* ── Header ── */}
        <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap size={22} className="text-white fill-white/10" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              LeadFlow<span className="text-emerald-400">CRM</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Internal Page</span>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center my-auto">
          
          {/* ── Left Column: Hero & CTA ── */}
          <section className="lg:col-span-7 flex flex-col items-start space-y-8 text-left">
            
            {/* Top Tagline */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
              <Sparkles size={16} className="text-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-extrabold tracking-wider uppercase">
                EXCLUSIVE FOR FLP MANAGERS
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                FLP Managers ke liye
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400">
                  Automatic Lead Distribution System
                </span>
              </h1>
              <p className="text-lg text-slate-400 font-medium leading-relaxed">
                Ab manual distribution ka jhanjhat khatam! Apne Facebook Ads leads ko bina kisi delay ke automatic, fair rotation ke saath poori team mein distribute karein.
              </p>
            </div>

            {/* Highly converting dynamic visual feature blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {[
                {
                  icon: Zap,
                  title: 'Real-time Routing',
                  desc: 'Meta Ads se incoming lead 1 second ke andar team ko auto-assign hoti hai.',
                  color: 'text-yellow-400',
                  bg: 'bg-yellow-500/10',
                  border: 'group-hover:border-yellow-500/30'
                },
                {
                  icon: Users,
                  title: 'Fair Rotation (Equal Split)',
                  desc: 'Har active member ko exact barabar leads milti hain, no bias.',
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                  border: 'group-hover:border-blue-500/30'
                },
                {
                  icon: BarChart3,
                  title: 'Team Tracker Dashboard',
                  desc: 'Ek page par poori team ke lead status aur follow-ups track karein.',
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10',
                  border: 'group-hover:border-purple-500/30'
                },
                {
                  icon: Shield,
                  title: '100% Exclusive Leads',
                  desc: 'Zero leak. Ek lead sirf ek hi member ke dashboard par show hogi.',
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10',
                  border: 'group-hover:border-emerald-500/30'
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="group p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/60 hover:border-slate-700/60 transition-all duration-300 flex flex-col space-y-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <h3 className="font-bold text-base text-slate-200">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Massive Green Pulse Button */}
            <div className="w-full max-w-lg space-y-3 pt-4">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow flex items-center justify-center gap-3 w-full py-4.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-lg shadow-xl transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97]"
              >
                <MessageCircle size={26} className="fill-white/10 animate-pulse" />
                <span>Free Demo Book Karo — WhatsApp Pe Aao</span>
                <ArrowRight size={22} className="ml-1 animate-pulse" />
              </a>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">🟢 WhatsApp Setup Only</span>
                <span>•</span>
                <span className="flex items-center gap-1">⚡ Free 30-min Audit</span>
                <span>•</span>
                <span className="flex items-center gap-1">❌ No Card Required</span>
              </div>
            </div>

          </section>

          {/* ── Right Column: Interactive Real-Time Simulator ── */}
          <section className="lg:col-span-5 flex items-center justify-center">
            
            <div className="anim-float w-full max-w-md bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl shadow-black/80 relative overflow-hidden backdrop-blur-xl">
              
              {/* Card Header Glass Highlight */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
              
              {/* Simulator Controls & Label */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/60">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Live Simulation</span>
                  <span className="text-sm font-extrabold text-slate-200">How LeadFlow Auto-Routes</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-[11px] font-bold text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>{totalLeadsRouted} Leads Routed</span>
                </div>
              </div>

              {/* SIMULATOR DIAGRAM VIEW */}
              <div className="space-y-6 relative py-4">
                
                {/* 1. Facebook Ads Block */}
                <div className="flex justify-center z-10 relative">
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 shadow-lg shadow-indigo-950/20">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                      f
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">Meta Ads Manager</span>
                      <span className="text-xs font-bold text-slate-200">Incoming New Lead</span>
                    </div>
                  </div>
                </div>

                {/* 2. Visual Connecting Lines */}
                <div className="h-16 flex justify-center items-center relative">
                  
                  {/* Background Connector Lines */}
                  <svg className="absolute w-full h-full" viewBox="0 0 200 64" fill="none">
                    <path 
                      d="M100 0 V64" 
                      stroke="#4f46e5" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                      className="opacity-40"
                    />
                    
                    {/* Glowing flow beam */}
                    {activeStep >= 1 && (
                      <path 
                        d="M100 0 V64" 
                        stroke="#10b981" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        className="animate-[beam-flow_2s_linear_infinite]"
                        strokeDasharray="10 20"
                      />
                    )}
                  </svg>

                  {/* Traveling Particle */}
                  {activeStep === 1 && (
                    <div className="absolute w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  {activeStep === 0 && (
                    <div className="absolute text-[10px] text-slate-500 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      Waiting for Lead
                    </div>
                  )}
                  {activeStep === 1 && (
                    <div className="absolute text-[10px] text-emerald-400 font-extrabold bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Syncing Lead...
                    </div>
                  )}
                </div>

                {/* 3. LeadFlow Router System Circle */}
                <div className="flex justify-center z-10 relative">
                  <div className={`w-20 h-20 rounded-full border-2 bg-slate-950 flex flex-col items-center justify-center transition-all duration-500 shadow-xl ${
                    activeStep === 2 ? 'border-emerald-400 shadow-emerald-500/10' : 'border-slate-800'
                  }`}>
                    <div className={`w-16 h-16 rounded-full border border-dashed flex items-center justify-center ${
                      activeStep === 2 ? 'border-emerald-500/50 animate-[spin_10s_linear_infinite]' : 'border-slate-800'
                    }`}>
                      <Zap size={22} className={`transition-colors duration-500 ${
                        activeStep === 2 ? 'text-emerald-400 animate-bounce' : 'text-slate-600'
                      }`} />
                    </div>
                    
                    {/* Ring Pulse on Router Activation */}
                    {activeStep === 2 && (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-[pulse-ring_1.5s_ease-out_infinite]" />
                        <div className="absolute inset-2 rounded-full border border-emerald-500/20 animate-[pulse-ring_1.5s_ease-out_infinite] [animation-delay:0.5s]" />
                      </>
                    )}
                  </div>
                </div>

                {/* 4. Visual Connecting Lines Lower */}
                <div className="h-16 flex justify-center items-center relative">
                  <svg className="absolute w-full h-full" viewBox="0 0 200 64" fill="none">
                    {/* Paths to three members */}
                    <path d="M100 0 L40 64" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M100 0 L100 64" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M100 0 L160 64" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

                    {/* Flowing animated lines to active destination */}
                    {activeStep === 3 && activeMemberIndex === 0 && (
                      <path d="M100 0 L40 64" stroke="#10b981" strokeWidth="3" className="animate-[beam-flow_1.5s_linear_infinite]" strokeDasharray="10 15" />
                    )}
                    {activeStep === 3 && activeMemberIndex === 1 && (
                      <path d="M100 0 L100 64" stroke="#10b981" strokeWidth="3" className="animate-[beam-flow_1.5s_linear_infinite]" strokeDasharray="10 15" />
                    )}
                    {activeStep === 3 && activeMemberIndex === 2 && (
                      <path d="M100 0 L160 64" stroke="#10b981" strokeWidth="3" className="animate-[beam-flow_1.5s_linear_infinite]" strokeDasharray="10 15" />
                    )}
                  </svg>

                  {/* Traveling Particle Lower */}
                  {activeStep === 3 && (
                    <div 
                      className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-400/50 transition-all duration-1000"
                      style={{
                        animation: 'pulse-btn 0.5s infinite',
                        left: activeMemberIndex === 0 ? 'calc(50% - 60px)' : activeMemberIndex === 1 ? 'calc(50% - 7px)' : 'calc(50% + 46px)',
                        top: 'calc(50% - 7px)',
                        transform: 'translateY(10px)'
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="absolute text-[10px] text-indigo-400 font-extrabold bg-indigo-950/60 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Routing Lead...
                    </div>
                  )}
                  {activeStep === 3 && (
                    <div className="absolute text-[10px] text-emerald-400 font-extrabold bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Sending...
                    </div>
                  )}
                </div>

                {/* 5. Team Members Cards Grid */}
                <div className="grid grid-cols-3 gap-2.5 z-10 relative">
                  {members.map((member, idx) => {
                    const isActive = activeMemberIndex === idx && activeStep === 3;
                    const isJustDelivered = lastDeliveredIndex === idx;
                    
                    return (
                      <div 
                        key={idx}
                        className={`p-3 rounded-2xl bg-slate-950 border text-center transition-all duration-500 relative flex flex-col justify-between items-center ${
                          isActive 
                            ? 'border-emerald-500/50 bg-emerald-950/10 scale-105 shadow-lg shadow-emerald-500/5' 
                            : isJustDelivered 
                              ? 'border-emerald-500 bg-emerald-900/10 scale-105 shadow-xl shadow-emerald-500/10 animate-[bounce_0.6s_ease-in-out_1]' 
                              : 'border-slate-800/80 bg-slate-950'
                        }`}
                      >
                        {/* Status Checkmark / Glow */}
                        {(isActive || isJustDelivered) && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                            <CheckCircle2 size={12} className="text-slate-950 font-bold" />
                          </div>
                        )}

                        <div className="flex flex-col items-center">
                          {/* Member Avatar */}
                          <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-1 text-[11px] font-bold ${
                            isActive || isJustDelivered ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                          }`}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          
                          <span className="text-[10px] font-bold text-slate-200 truncate max-w-full block">
                            {member.name.split(' ')[0]}
                          </span>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider block">
                            {member.role.split(' ')[0]}
                          </span>
                        </div>

                        {/* Leads Counter */}
                        <div className="mt-2 w-full pt-1.5 border-t border-slate-900/60">
                          <span className="text-[9px] text-slate-500 uppercase block tracking-wider font-semibold">Leads</span>
                          <span className={`text-base font-extrabold transition-colors duration-300 ${
                            isJustDelivered ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {member.count}
                          </span>
                        </div>

                        {/* Floating +1 Indicator */}
                        {isJustDelivered && (
                          <span className="absolute -top-6 text-xs font-black text-emerald-400 animate-[float-particle_1.2s_ease-out_1]">
                            +1 Lead
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Bottom Simulation Info */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/40 text-left flex items-start gap-2.5">
                <UserCheck size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Manager Control:</strong> System automatic rotation control karta hai aur har ek step par alerts members ko send karta hai.
                </p>
              </div>

            </div>

          </section>

        </main>

        {/* ── Footer ── */}
        <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950/50 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 text-center md:text-left">
              &copy; {new Date().getFullYear()} LeadFlow CRM. All Rights Reserved. For FLP Internal Teams Only.
            </p>
            <div className="flex items-center gap-6 text-slate-500 text-xs font-medium">
              <span className="hover:text-slate-400 cursor-default">Privacy Protocol</span>
              <span className="hover:text-slate-400 cursor-default">SSL Encryption</span>
              <span className="hover:text-slate-400 cursor-default">Fair Rotator V3.9</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
};

export default FlpDemoBooking;
