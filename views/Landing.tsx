import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Zap, BarChart3, Shield, ArrowRight,
  Play, Users, Lock, Menu, X
} from 'lucide-react';

export const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="font-sans bg-white text-slate-900 overflow-x-hidden">

      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center gap-2 font-extrabold text-xl">
            <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">LF</div>
            LeadFlow
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-blue-600">How it Works</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Pricing</a>
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Login</Link>
            <Link
              to="/login"
              className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow hover:bg-slate-800"
            >
              Start Daily Flow →
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4">
            <a href="#how-it-works" className="block font-semibold">How it Works</a>
            <a href="#pricing" className="block font-semibold">Pricing</a>
            <Link to="/login" className="block font-semibold">Login</Link>
            <Link to="/login" className="block bg-blue-600 text-white text-center py-3 rounded-xl font-bold">
              Start Now
            </Link>
          </div>
        )}
      </nav>

      {/* ================= HERO ================= */}
      <section className="pt-32 pb-20 text-center relative px-4">
        <div className="max-w-4xl mx-auto">

          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-6">
            🔵 Daily Lead System Live
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Roz ki <span className="text-blue-600">Fresh Leads.</span><br />
            Zero Manual Work.
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
            Excel forward band karo. Leads seedha dashboard aur WhatsApp par aati hain.
            <br />
            <span className="font-medium text-slate-700">
              Ek disciplined daily calling system — no bulk dump.
            </span>
          </p>

          {/* TRUST STRIP */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 mb-10">
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Fixed Daily Flow</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} /> City-based Rotation</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Replacement for Invalid Leads*</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} /> Used by Active MLM Teams</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow hover:bg-blue-700"
            >
              Join Daily Flow
            </Link>
            <button className="px-8 py-4 border border-slate-300 rounded-xl font-bold text-lg flex items-center gap-2">
              <Play size={18} /> See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">The Daily Flow Routine</h2>
          <p className="text-slate-500 mb-12">System jo habit bana deta hai.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              ['🌅 Morning Drop', 'Subah fresh leads automatically milti hain.'],
              ['📞 Day Action', 'Call karo, status update karo.'],
              ['🔄 Night Reset', 'Next day ke liye system ready hota hai.']
            ].map(([title, desc]) => (
              <div key={title} className="bg-white p-8 rounded-2xl border">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-slate-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">

          <h2 className="text-3xl font-bold mb-4">Start Your Daily Flow</h2>
          <p className="text-slate-400 mb-4">
            ⚠ Limited daily capacity per city to maintain lead quality
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">

            {/* SOLO */}
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 opacity-80">
              <h3 className="text-xl font-bold mb-2">Solo Agent</h3>
              <p className="text-xs text-yellow-400 mb-2">Best for testing system only</p>
              <div className="text-3xl font-bold mb-6">₹999<span className="text-sm text-slate-400">/mo</span></div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li>✔ Daily Lead Flow</li>
                <li>✔ Personal Dashboard</li>
                <li>✔ WhatsApp Integration</li>
              </ul>
              <Link to="/signup" className="block w-full py-3 border border-slate-600 rounded-xl font-bold">
                Try Solo
              </Link>
            </div>

            {/* MANAGER */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-800 p-8 rounded-3xl border border-blue-500 shadow-2xl scale-105">
              <div className="text-xs uppercase bg-yellow-400 text-black inline-block px-3 py-1 rounded mb-4">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Team Manager</h3>
              <div className="text-4xl font-bold mb-4">₹3,999<span className="text-sm text-blue-200">/mo</span></div>

              <p className="text-sm text-blue-100 mb-6">
                Recommended for anyone earning from MLM or Sales.
              </p>

              <ul className="space-y-3 text-sm font-medium mb-8">
                <li>✔ Auto Lead Assignment</li>
                <li>✔ Manager Spy View (Team Activity)</li>
                <li>✔ Unlimited Team Members</li>
                <li>✔ Higher Conversion Per Lead</li>
                <li>✔ Discipline-based Daily Calling</li>
              </ul>

              <Link
                to="/signup"
                className="block w-full py-4 bg-white text-blue-700 rounded-xl font-bold shadow"
              >
                Create Team Account
              </Link>
            </div>

            {/* AGENCY */}
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 opacity-80">
              <h3 className="text-xl font-bold mb-2">Agency</h3>
              <div className="text-3xl font-bold mb-6">Custom</div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li>✔ Multiple Teams</li>
                <li>✔ White Label Domain</li>
                <li>✔ Priority Support</li>
              </ul>
              <a href="mailto:sales@leadflowcrm.in" className="block w-full py-3 border border-slate-600 rounded-xl font-bold">
                Contact Sales
              </a>
            </div>

          </div>

          {/* RENEWAL SEED */}
          <div className="mt-16 text-sm text-slate-400 max-w-3xl mx-auto">
            <p className="mb-2 font-semibold text-white">Why most users renew?</p>
            <p>
              Daily habit ban jaati hai. Team ka calling routine set ho jaata hai.
              Lead flow rukna loss lagne lagta hai.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-black text-slate-500 py-12 text-sm text-center">
        © 2025 LeadFlow CRM. Discipline beats motivation.
      </footer>
    </div>
  );
};

export default Landing;
