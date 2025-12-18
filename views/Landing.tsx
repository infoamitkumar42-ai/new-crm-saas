import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, Zap, BarChart3, Shield, ArrowRight, 
  Star, Lock, Server, Play, Users, Globe, Layout, 
  Smartphone, Clock, X, Menu, Repeat, RefreshCw
} from 'lucide-react';

export const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    // Added pb-24 to ensure content isn't hidden behind sticky mobile CTA
    <div className="font-sans text-slate-900 overflow-x-hidden bg-white selection:bg-blue-100 selection:text-blue-900 pb-24 md:pb-0">
      
      {/* 🚀 ANIMATIONS CSS */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* ================= NAV BAR ================= */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg">LF</div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">LeadFlow</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                Start Daily Flow <ArrowRight size={16} />
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-600">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-xl absolute w-full">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block font-semibold text-slate-600">How it Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block font-semibold text-slate-600">Pricing</a>
            <Link to="/login" className="block font-semibold text-slate-600">Login</Link>
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold">Start Now</Link>
          </div>
        )}
      </nav>

      {/* ================= HERO SECTION (REWRITTEN) ================= */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] md:w-[1000px] h-[500px] bg-blue-50 rounded-full blur-[100px] opacity-60 -z-10"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-100 text-blue-700 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            System Live: Daily Drops Active
          </div>

          {/* 🔥 NEW: Live Counter Added Here */}
          <div className="flex items-center justify-center gap-2 mb-6 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <p className="text-sm font-mono text-slate-500">
              <span className="font-bold text-slate-900">1,240</span> leads distributed today
            </p>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
            Roz ki <span className="text-blue-600">Fresh Leads.</span><br />
            Zero Manual Work.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
            Manual forwarding band karo. 
            Leads seedha aapke dashboard aur WhatsApp par aati hain.
            <span className="block mt-2 font-medium text-slate-700">Ek disciplined calling system. No bulk dump.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Zap size={20} className="fill-current" /> Join Daily Flow
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Play size={20} className="fill-slate-700" /> See How It Works
            </button>
          </div>

          {/* Screenshot (Dashboard Preview) */}
          <div className="relative mx-auto max-w-[95%] md:max-w-5xl group animate-float">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-slate-900 rounded-xl md:rounded-2xl shadow-2xl border border-slate-800 p-1 md:p-2 overflow-hidden ring-1 ring-white/10">
               <div className="h-6 md:h-10 bg-slate-800 rounded-t-lg md:rounded-t-xl flex items-center px-2 md:px-4 gap-2 mb-1 border-b border-slate-700">
                  <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><div className="w-2 h-2 rounded-full bg-yellow-500"></div><div className="w-2 h-2 rounded-full bg-green-500"></div></div>
                  <div className="ml-4 px-4 py-1 bg-slate-950 rounded text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <Lock size={10} className="text-green-500"/> app.leadflow.in
                  </div>
               </div>
               <div className="bg-slate-50 rounded-b-lg md:rounded-b-xl aspect-[16/9] flex flex-col items-center justify-center border-t border-slate-200">
                  <BarChart3 size={48} className="text-blue-600 mb-2" />
                  <p className="font-bold text-slate-700">Live System Dashboard</p>
                  <p className="text-xs text-slate-500">Real-time Lead Tracking</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= THE ROUTINE (HOW IT WORKS) ================= */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Daily Flow Routine</h2>
            <p className="text-slate-500">System aise kaam karta hai, taaki aapki habit ban jaye.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-slate-200 -z-10"></div>

            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center relative hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold border-4 border-white shadow-sm">
                🌅
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Morning Drop</h3>
              <p className="text-slate-500 text-sm">
                Subah 9:00 AM system automatically fresh leads aapke dashboard me daal deta hai. No waiting.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center relative hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold border-4 border-white shadow-sm">
                📞
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Day Action</h3>
              <p className="text-slate-500 text-sm">
                Aap call karte hain, status update karte hain (Interested/Closed). Manager sab live dekhta hai.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center relative hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold border-4 border-white shadow-sm">
                🔄
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Night Reset</h3>
              <p className="text-slate-500 text-sm">
                Raat ko system reset hota hai. Pending leads orphan bank me jaati hain. Kal ke liye fresh start.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHO THIS IS NOT FOR (Negative Filtering) ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 rounded-3xl p-8 md:p-12 border border-red-100 text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-6">🚫 Who This is NOT For</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <p className="font-bold text-slate-800 mb-1">Lazy Callers</p>
                <p className="text-xs text-slate-500">System tracks activity. If you don't call, you get caught.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <p className="font-bold text-slate-800 mb-1">WhatsApp Forwarders</p>
                <p className="text-xs text-slate-500">We don't do Excel dumps. This is a disciplined CRM.</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <p className="font-bold text-slate-800 mb-1">One-Day Seekers</p>
                <p className="text-xs text-slate-500">This is for consistent, daily growth. Not a lottery.</p>
              </div>
            </div>
            <p className="mt-8 text-red-800 font-medium text-sm">
              If you are serious about building a discipline, then welcome aboard.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SIMPLIFIED PRICING (No Math) ================= */}
      <section id="pricing" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Daily Flow</h2>
          <p className="text-slate-400 mb-12">Simple pricing. No hidden lead costs here.</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            
            {/* Solo */}
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 opacity-80 hover:opacity-100 transition-all">
              <h3 className="text-xl font-bold mb-2">Solo Agent</h3>
              <div className="text-3xl font-bold mb-6">₹999<span className="text-sm font-normal text-slate-400">/mo</span></div>
              <ul className="text-left space-y-3 mb-8 text-sm text-slate-300">
                <li className="flex gap-2"><CheckCircle size={16} className="text-blue-400"/> Daily Lead Flow</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-blue-400"/> Personal Dashboard</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-blue-400"/> WhatsApp Integration</li>
              </ul>
              <Link to="/signup?role=member" className="block w-full py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-bold">Start Solo</Link>
            </div>

            {/* Manager (Highlighted) */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-800 p-8 rounded-3xl border border-blue-500 transform md:scale-110 shadow-2xl relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-b-lg uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-bold mb-2 mt-2">Team Manager</h3>
              <div className="text-4xl font-bold mb-6">₹3,999<span className="text-sm font-normal text-blue-200">/mo</span></div>
              <p className="text-sm text-blue-100 mb-6 border-b border-blue-500/50 pb-4">
                Automate your entire team of 5-10 people.
              </p>
              <ul className="text-left space-y-3 mb-8 text-sm font-medium">
                <li className="flex gap-2"><CheckCircle size={16} className="text-white"/> <strong>Auto-Assignment Engine</strong></li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-white"/> Manager "Spy View"</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-white"/> Unlimited Team Members</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-white"/> Export Reports</li>
              </ul>
              <Link to="/signup?role=manager" className="block w-full py-4 bg-white text-blue-800 rounded-xl hover:bg-blue-50 transition-all font-bold shadow-lg">
                Create Team Account
              </Link>
            </div>

            {/* Agency */}
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 opacity-80 hover:opacity-100 transition-all">
              <h3 className="text-xl font-bold mb-2">Agency</h3>
              <div className="text-3xl font-bold mb-6">Custom</div>
              <ul className="text-left space-y-3 mb-8 text-sm text-slate-300">
                <li className="flex gap-2"><CheckCircle size={16} className="text-blue-400"/> Multiple Teams</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-blue-400"/> White Label Domain</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-blue-400"/> Priority Support</li>
              </ul>
              <a href="mailto:sales@leadflowcrm.in" className="block w-full py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-bold">Contact Sales</a>
            </div>

          </div>
        </div>
      </section>

      {/* ================= 🔥 NEW: FAQ SECTION ================= */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10 text-slate-900">Common Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Kya main apni purani leads upload kar sakta hu?", a: "Haan, Manager plan mein Bulk Upload feature available hai." },
              { q: "Payment ke baad setup mein kitna time lagta hai?", a: "0 Minutes. Sign up karte hi dashboard ready ho jata hai." },
              { q: "Kya main cancel kar sakta hu?", a: "Bilkul. Monthly plan hai, jab chahein band karein." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2">{item.q}</h3>
                <p className="text-slate-500 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-black text-slate-500 py-12 text-sm border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">LF</div>
              <span className="font-bold text-white text-lg">LeadFlow</span>
            </div>
            <p className="text-xs">Discipline & Automation for modern sales teams.</p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
              <li><Link to="/signup" className="hover:text-white">Start Trial</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Refund Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase">Contact</h4>
            <p className="mb-2">support@leadflowcrm.in</p>
            <p>Gurugram, India</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-slate-900 text-center text-xs">
          © 2024 LeadFlow CRM. All rights reserved.
        </div>
      </footer>

      {/* 🔥 NEW: Sticky CTA for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <Link to="/login" className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-bold text-lg shadow-lg">
          Start Daily Flow Now
        </Link>
      </div>

    </div>
  );
};

export default Landing;
