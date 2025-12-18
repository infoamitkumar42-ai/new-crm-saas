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
    <div className="font-sans text-slate-900 overflow-x-hidden bg-white selection:bg-blue-100 selection:text-blue-900">

      {/* ================= NAV BAR ================= */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg">LF</div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">LeadFlow</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-blue-600">How it Works</a>
              <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Pricing</a>
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Login</Link>
              <Link to="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:bg-slate-800 flex items-center gap-2">
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
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold">
              Start Now
            </Link>
          </div>
        )}
      </nav>

      {/* ================= HERO ================= */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] md:w-[1000px] h-[500px] bg-blue-50 rounded-full blur-[100px] opacity-60 -z-10"></div>

        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-100 text-blue-700 rounded-full text-xs font-bold mb-6">
            🔵 System Live: Daily Drops Active
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 leading-tight">
            Roz ki <span className="text-blue-600">Fresh Leads.</span><br />
            Zero Manual Work.
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-8">
            Manual forwarding band karo.
            Leads seedha dashboard aur WhatsApp par aati hain.
            <span className="block mt-2 font-medium text-slate-700">
              Ek disciplined daily calling system. No bulk dump.
            </span>
          </p>

          {/* TRUST STRIP */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 mb-10">
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Fixed Daily Flow</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} /> City-based Rotation</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Invalid Lead Replacement*</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Built for MLM Teams</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/login" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-blue-700 flex items-center gap-2">
              <Zap size={20} /> Join Daily Flow
            </Link>
            <button className="px-8 py-4 bg-white border border-slate-200 rounded-xl font-bold text-lg flex items-center gap-2">
              <Play size={20} /> See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">The Daily Flow Routine</h2>
          <p className="text-slate-500 mb-16">System jo habit bana deta hai.</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border">
              <div className="text-3xl mb-4">🌅</div>
              <h3 className="text-xl font-bold mb-2">Morning Drop</h3>
              <p className="text-slate-500 text-sm">Fresh leads automatically subah milti hain.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border">
              <div className="text-3xl mb-4">📞</div>
              <h3 className="text-xl font-bold mb-2">Day Action</h3>
              <p className="text-slate-500 text-sm">Call, WhatsApp, status update. Manager sab dekhta hai.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-2">Night Reset</h3>
              <p className="text-slate-500 text-sm">Next day ke liye system fresh ho jaata hai.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHO NOT FOR ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 rounded-3xl p-10 border border-red-100 text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-6">🚫 Who This is NOT For</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-xl">
                <p className="font-bold">Lazy Callers</p>
                <p className="text-xs text-slate-500">Activity tracked hoti hai.</p>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <p className="font-bold">WhatsApp Forwarders</p>
                <p className="text-xs text-slate-500">Excel dump nahi hota.</p>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <p className="font-bold">One-day Seekers</p>
                <p className="text-xs text-slate-500">Lottery system nahi hai.</p>
              </div>
            </div>
            <p className="mt-8 text-red-800 font-medium text-sm">
              This system rewards consistency, not shortcuts.
            </p>
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Daily Flow</h2>
          <p className="text-slate-400 mb-12">
            ⚠ Limited daily capacity per city to maintain lead quality
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">

            {/* SOLO */}
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 opacity-80">
              <h3 className="text-xl font-bold mb-2">Solo Agent</h3>
              <p className="text-xs text-yellow-400 mb-4">Best only for testing system</p>
              <div className="text-3xl font-bold mb-6">₹999<span className="text-sm text-slate-400">/mo</span></div>
              <Link to="/signup" className="block w-full py-3 border border-slate-600 rounded-xl font-bold">
                Try System
              </Link>
            </div>

            {/* MANAGER */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-800 p-8 rounded-3xl border border-blue-500 shadow-2xl scale-110">
              <div className="bg-yellow-400 text-black text-xs px-3 py-1 rounded mb-4 inline-block">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Team Manager</h3>
              <div className="text-4xl font-bold mb-4">₹3,999<span className="text-sm text-blue-200">/mo</span></div>
              <p className="text-sm text-blue-100 mb-6">
                Built for leaders who want discipline, not excuses.
              </p>
              <ul className="space-y-3 text-sm mb-8">
                <li>✔ Auto Assignment</li>
                <li>✔ Spy View</li>
                <li>✔ Unlimited Team</li>
                <li>✔ Higher Conversion</li>
              </ul>
              <Link to="/signup" className="block w-full py-4 bg-white text-blue-700 rounded-xl font-bold">
                Create Team Account
              </Link>
            </div>

            {/* AGENCY */}
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 opacity-80">
              <h3 className="text-xl font-bold mb-2">Agency</h3>
              <div className="text-3xl font-bold mb-6">Custom</div>
              <a href="mailto:sales@leadflowcrm.in" className="block w-full py-3 border border-slate-600 rounded-xl font-bold">
                Contact Sales
              </a>
            </div>

          </div>

          {/* RENEWAL SEED */}
          <div className="mt-16 text-sm text-slate-400 max-w-3xl mx-auto">
            <p className="mb-2 font-semibold text-white">Why most users renew?</p>
            <p>
              Daily habit ban jaati hai. Team calling routine set ho jaata hai.
              Lead flow rukna loss lagne lagta hai.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-black text-slate-500 py-12 text-sm border-t border-slate-900 text-center">
        © 2025 LeadFlow CRM. Discipline beats motivation.
      </footer>
    </div>
  );
};

export default Landing;
