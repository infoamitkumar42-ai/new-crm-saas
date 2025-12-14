import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Zap, BarChart3, Shield, ArrowRight, Smartphone, Users, Globe, Star, Lock, Server } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="font-sans text-slate-900 scroll-smooth">
      
      {/* ================= NAV BAR ================= */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">LF</div>
              <span className="font-bold text-xl tracking-tight text-slate-900">LeadFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 hidden md:block">
                Login
              </Link>
              <Link to="/login" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2">
                Get Started <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION (Updated for Screenshot) ================= */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in border border-blue-200">
            🔥 Offer: 50% OFF for First 100 Teams
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Convert More Leads with<br />
            <span className="text-blue-600">Automated Distribution</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect Google Sheets to your team's WhatsApp in seconds. Track performance, reduce leakage, and boost sales by 300%.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-blue-700 transition-transform hover:-translate-y-1 ring-4 ring-blue-100">
              Start Free Trial
            </Link>
            <a href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all">
              View Pricing
            </a>
          </div>

          {/* 👇 UPDATED SCREENSHOT FRAME (Looks like a Browser) */}
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-blue-600 blur-[120px] opacity-20 rounded-full"></div>
            
            <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 overflow-hidden ring-1 ring-slate-900/10">
               {/* Browser Header Dots */}
               <div className="h-8 bg-slate-800 rounded-t-xl flex items-center px-4 gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 px-3 py-1 bg-slate-700 rounded-md text-[10px] text-slate-400 font-mono">leadflow.app/dashboard</div>
               </div>

               {/* 👇 Yahan Apna REAL SCREENSHOT lagana */}
               {/* Agar image hai to: <img src="/dashboard.png" className="w-full rounded-b-xl" /> */}
               <div className="bg-white rounded-b-xl aspect-[16/9] flex items-center justify-center border-t border-slate-700 relative overflow-hidden group">
                  <div className="text-center z-10">
                    <BarChart3 size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold text-lg">Your Dashboard Screenshot Goes Here</p>
                    <p className="text-slate-400 text-sm mt-2">(Replace this div with your &lt;img&gt; tag)</p>
                  </div>
                  {/* Grid Pattern Background */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRUST STRIP ================= */}
      <section className="py-8 border-y border-slate-100 bg-slate-50/50">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Trusted by 500+ High Performance Teams</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all items-center">
                {/* Brand Placeholders (Replace with SVGs if needed) */}
                <span className="text-lg font-bold text-slate-600 flex items-center gap-2"><Lock size={18}/> Enterprise Security</span>
                <span className="text-lg font-bold text-slate-600 flex items-center gap-2"><Server size={18}/> 99.9% Uptime</span>
                <span className="text-lg font-bold text-slate-600 flex items-center gap-2"><Shield size={18}/> GDPR Ready</span>
            </div>
         </div>
      </section>

      {/* ================= TESTIMONIALS (Social Proof) ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Loved by Managers</h2>
            <p className="text-slate-500 mt-2">See what team leaders say about LeadFlow.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
                quote="Before LeadFlow, we wasted 4 hours daily assigning leads manually. Now it's instant. Sales up by 40%!"
                name="Rahul Sharma"
                role="Team Leader, FinCorp"
                stars={5}
            />
             <TestimonialCard 
                quote="The 'Manager Spy View' is a game changer. I know exactly who is working and who is slacking. Highly recommended."
                name="Priya Singh"
                role="Sales Manager, EdTech"
                stars={5}
            />
             <TestimonialCard 
                quote="Simple UI. My team understood it in 1
