import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Zap, Shield, ArrowRight,
  Star, Lock, X, Menu,
  MessageCircle, Clock, Gift, ChevronDown,
  Users, RefreshCw
} from 'lucide-react';
import * as Sentry from '@sentry/react';

// ✅ Verification Button Component (Only shows for ?test=true)
const ErrorButton = () => {
  const isTestMode = window.location.search.includes('test=true');
  if (!isTestMode) return null;

  return (
    <button
      onClick={() => {
        throw new Error('LeadFlow Sentry Verification: This is your first intentional error! 🚀');
      }}
      className="fixed bottom-4 left-4 z-[9999] px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold shadow-lg border border-blue-200 hover:bg-blue-600 hover:text-white transition-all animate-pulse"
    >
      ⚠️ Verify Sentry
    </button>
  );
}

export const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveLeadsCount, setLiveLeadsCount] = useState(1847);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 🔥 Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 47, seconds: 23 });

  const WHATSAPP_NUMBER = "917009064038";

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLeadsCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 Countdown Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 }; // Reset
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Exit Popup logic removed as per request for cleaner design
  useEffect(() => {
    // Optional: Keep only very subtle behavior if needed
  }, []);

  // ✅ REALISTIC Indian Testimonials with genuine Hinglish
  const testimonials = [
    {
      name: "Rajesh Sharma",
      role: "Supervisor, Lucknow",
      city: "Lucknow",
      text: "Pehle main cold calling karta tha, logon ne block kar diya tha. Ab leads khud interested hoke aati hain. 3 mahine mein 12 sponsors mile!",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Priya Gupta",
      role: "Assistant Manager, Delhi",
      city: "Delhi NCR",
      text: "Meri team mein 8 log hain, sabko maine Starter plan dilwaya. Ab main sirf training pe focus karti hun, leads automatic milti hain!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Vikram Singh",
      role: "Manager, Chandigarh",
      city: "Chandigarh",
      text: "₹11 per lead bohot sasta hai bhai. Facebook ads khud chalaoge toh ₹50-60 lagega per lead. Yahan ready-to-call leads milti hain directly.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Sunita Devi",
      role: "Supervisor, Jaipur",
      city: "Jaipur",
      text: "Ghar baith ke kaam karti hun. Subah leads aati hain, dopahar mein call karti hun. Husband bhi impressed hai ab meri income se!",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Amit Verma",
      role: "Soaring Manager, Mumbai",
      city: "Mumbai",
      text: "2CC karne mein 6 mahine lag gaye the pehle. LeadFlow ke baad sirf 45 din mein Silver Manager ban gaya. System sach mein kaam karta hai!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Neha Patel",
      role: "FLP Distributor, Ahmedabad",
      city: "Ahmedabad",
      text: "Fresh leads daily milti hain. Kal ek lead se 2 hours baat ki, wo abhi join karne wali hai. Quality bahut acchi hai!",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const faqs = [
    {
      q: "Kya ye leads Forever Living business ke liye hain?",
      a: "Bilkul! Ye leads wahi log hain jo 'Work From Home', 'Passive Income' aur 'Business Opportunity' dhund rahe hain."
    },
    {
      q: "Leads kahan se generate hoti hain?",
      a: "Hum Facebook aur Instagram Ads use karte hain specific 'Network Marketing' interest targeting ke saath."
    },
    {
      q: "Setup mein kitna time lagta hai?",
      a: "Sirf 2 Minute. Plan choose karo aur turant Dashboard mil jayega. Leads subah 10 baje se aani shuru ho jayengi."
    },
    {
      q: "Agar leads phone na uthaye toh?",
      a: "Humare 'Supervisor' aur 'Manager' plan mein 'Lead Replacement Guarantee' milti hai invalid numbers ke liye."
    },
    {
      q: "Kya main apni purani leads upload kar sakta hu?",
      a: "Haan, Manager plan mein Bulk Upload aur Team Distribution ka feature available hai."
    }
  ];

  return (
    <div className="font-sans text-slate-900 overflow-x-hidden bg-white selection:bg-blue-100 selection:text-blue-900">

      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 z-[60] transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px) rotate(-1deg); } 75% { transform: translateX(2px) rotate(1deg); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
        @keyframes bounce-in { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* TOP BAR - With Countdown Timer */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-medium">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="animate-pulse">🔥</span>
          <span>New User Offer:</span>
          <strong>3 BONUS Leads FREE!</strong>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold flex items-center gap-1">
            ⏰ Ends in: {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* NAV BAR */}
      <nav className="sticky top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                LF
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">LeadFlow</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Success Stories</a>
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/login" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                Start Now <ArrowRight size={16} />
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-600 p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-3 shadow-xl absolute w-full">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">How it Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">Success Stories</a>
            <Link to="/login" className="block py-2 font-semibold text-slate-600">Login</Link>
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold mt-2">
              Start Now
            </Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 relative overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] md:w-[1200px] h-[600px] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-3xl opacity-70 -z-10"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-bold mb-6">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                {liveLeadsCount.toLocaleString()} FLP leads distributed today
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                Forever Business के लिए
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">High Quality Leads</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                Ab <strong>2cc Complete</strong> karna hua aasaan.
                <strong className="text-slate-800"> ₹11/lead</strong> mein 'Business Interested' log seedha
                aapke WhatsApp aur Dashboard par.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={18} className="text-green-500" />
                  <span>No Rejections</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={18} className="text-green-500" />
                  <span>Auto-Followup</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  to="/login"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Zap size={20} className="group-hover:animate-shake" />
                  Get Verified Leads • ₹11 Only
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  ▶ Watch Demo
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-3">
                  {/* Real Indian profile images */}
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">
                    Used by <strong>500+ FLP Distributors</strong>
                  </p>
                </div>
              </div>

              {/* 🔥 TRUST BADGES */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                  <Shield size={14} />
                  <span>100% Secure Payment</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700">
                  <RefreshCw size={14} />
                  <span>Replacement Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-xs font-medium text-purple-700">
                  <MessageCircle size={14} />
                  <span>24/7 WhatsApp Support</span>
                </div>
              </div>
            </div>

            {/* DASHBOARD PREVIEW */}
            <div className="relative animate-float hidden md:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 overflow-hidden">
                <div className="h-8 bg-slate-100 rounded-t-xl flex items-center px-4 gap-2 border-b border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-white rounded text-xs text-slate-500 font-mono flex items-center gap-2">
                    <Lock size={10} className="text-green-500" /> app.leadflowcrm.in
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-b-xl p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">Today's Leads</p>
                      <p className="text-2xl font-bold text-blue-600">12</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">Interested</p>
                      <p className="text-2xl font-bold text-green-600">5</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">2cc Done</p>
                      <p className="text-2xl font-bold text-purple-600">2</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {['Rohan (Interested in Biz)', 'Suman (Part Time)', 'Amit (Student)'].map((name, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                            {name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-800">{name}</p>
                            <p className="text-xs text-slate-500">Just now • Facebook Ad</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Fresh</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-black text-blue-600">500+</p>
              <p className="text-slate-600 font-medium mt-1">Active Agents</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-green-600">50K+</p>
              <p className="text-slate-600 font-medium mt-1">Leads Delivered</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-purple-600">₹11</p>
              <p className="text-slate-600 font-medium mt-1">Per Lead Only</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-orange-600">4.8★</p>
              <p className="text-slate-600 font-medium mt-1">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON - THE OLD WAY VS NEW WAY */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Top Managers Switched to LeadFlow?
            </h2>
            <p className="text-slate-500 text-lg">Stop wasting time on methods that don't work.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-0">
            {/* The Old Way */}
            <div className="bg-red-50 p-8 rounded-3xl md:rounded-r-none border border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-red-100 p-2 rounded-lg text-2xl">😫</span>
                <h3 className="text-xl font-bold text-red-900">Old Way (Struggle)</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-red-800/80">
                  <X size={20} className="mt-0.5 text-red-500 flex-shrink-0" />
                  <span>DMing strangers on Instagram (Blocked)</span>
                </li>
                <li className="flex items-start gap-3 text-red-800/80">
                  <X size={20} className="mt-0.5 text-red-500 flex-shrink-0" />
                  <span>Calling friends & relatives (Rejected)</span>
                </li>
                <li className="flex items-start gap-3 text-red-800/80">
                  <X size={20} className="mt-0.5 text-red-500 flex-shrink-0" />
                  <span>Spending ₹50-60 per lead on generic Ads</span>
                </li>
                <li className="flex items-start gap-3 text-red-800/80">
                  <X size={20} className="mt-0.5 text-red-500 flex-shrink-0" />
                  <span>Manual follow-up in notebook</span>
                </li>
              </ul>
            </div>

            {/* The New Way */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-blue-600 relative overflow-hidden transform md:scale-105 z-10">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                RECOMMENDED
              </div>
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-100 p-2 rounded-lg text-2xl">🚀</span>
                <h3 className="text-xl font-bold text-blue-900">LeadFlow Way (Success)</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-700 font-medium">
                  <CheckCircle size={20} className="mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Interested Leads directly on WhatsApp</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 font-medium">
                  <CheckCircle size={20} className="mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Professional approach (No begging)</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 font-medium">
                  <CheckCircle size={20} className="mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Only ₹11/lead (High Quality)</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 font-medium">
                  <CheckCircle size={20} className="mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Automated Dashboard & Follow-ups</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LEAD SOURCES - Where We Get Leads From */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-4">
              📍 LEAD SOURCES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Hum Leads Kahan Se Laate Hain?
            </h2>
            <p className="text-slate-500 text-lg">100% Targeted, Business Interested Audience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Facebook Ads */}
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Facebook Ads</h3>
              <p className="text-slate-600 text-sm">
                "Work From Home", "Passive Income", "Business Opportunity" interest targeting
              </p>
            </div>

            {/* Instagram Ads */}
            <div className="text-center p-8 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instagram Ads</h3>
              <p className="text-slate-600 text-sm">
                Reels & Stories ads targeting women 25-45 interested in health & wellness
              </p>
            </div>

            {/* Google Ads */}
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Search Intent</h3>
              <p className="text-slate-600 text-sm">
                People actively searching "How to earn from home", "Part time business"
              </p>
            </div>
          </div>

          {/* Targeting Info */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-black">100%</p>
                <p className="text-blue-200 text-sm">Verified Leads</p>
              </div>
              <div>
                <p className="text-3xl font-black">Pan India</p>
                <p className="text-blue-200 text-sm">Target Audience</p>
              </div>
              <div>
                <p className="text-3xl font-black">Active</p>
                <p className="text-blue-200 text-sm">Business Seekers</p>
              </div>
              <div>
                <p className="text-3xl font-black">Quality</p>
                <p className="text-blue-200 text-sm">High Intent</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">
              🔧 HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              3 Simple Steps to Get Leads
            </h2>
            <p className="text-slate-500 text-lg">Setup in 2 minutes. Start receiving leads today.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Choose Your Plan</h3>
              <p className="text-slate-600">
                Select based on your daily lead requirement. Start with Starter or go Pro with Manager plan.
              </p>
            </div>

            <div className="text-center group bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/25 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Get Your Dashboard</h3>
              <p className="text-slate-600">
                Instant access to your personal lead dashboard + Google Sheet. No technical setup needed.
              </p>
            </div>

            <div className="text-center group bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/25 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Receive Daily Leads</h3>
              <p className="text-slate-600">
                Fresh leads delivered daily between 10 AM - 10 PM. Call them, close them, grow your team!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20 bg-white overflow-hidden">
        <div className="text-center mb-12 px-4">
          <span className="inline-block px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">
            ⭐ SUCCESS STORIES
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Forever Leaders ki Pasand
          </h2>
          <p className="text-slate-500 text-lg">Top Earners ye system use kar rahe hain</p>
        </div>

        <div className="relative w-full max-w-[100vw] overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-[300px] md:w-[400px] mx-4 flex-shrink-0">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={t.image} alt={t.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs font-bold text-blue-600 uppercase bg-blue-100 px-2 py-0.5 rounded-full inline-block">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">"{t.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING - MATCHES SUBSCRIPTION.TSX */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-bold mb-4">
              💰 SIMPLE PRICING
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Growth Plan
            </h2>
            <p className="text-slate-400 text-lg">Fresh leads daily • 100% Exclusive • Real-time delivery</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Starter - ₹999/10 days */}
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:border-slate-600 transition-all flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-sm text-slate-400">Perfect to Begin</p>
              </div>
              <div className="mb-2">
                <span className="text-sm text-slate-400 line-through">₹1,499</span>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹999</span>
                <span className="text-slate-400">/10 days</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> <strong>5 Fresh Leads/Day</strong></li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> 50 Total Leads</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Personal Dashboard</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> WhatsApp Alerts</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> 5 Lead Replacements</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-bold text-center">
                Start Now
              </Link>
            </div>

            {/* Supervisor - ₹1,999/15 days - BEST VALUE */}
            <div className="bg-gradient-to-b from-blue-600 to-indigo-700 p-8 rounded-3xl border-2 border-blue-400 transform md:-translate-y-4 shadow-2xl shadow-blue-500/25 flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  ⭐ BEST VALUE
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold mb-2">Supervisor</h3>
                <p className="text-sm text-blue-200">Most Popular Choice</p>
              </div>
              <div className="mb-2">
                <span className="text-sm text-blue-200 line-through">₹2,999</span>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹1,999</span>
                <span className="text-blue-200">/15 days</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm font-medium"><CheckCircle size={18} className="text-white flex-shrink-0" /> <strong>7 Fresh Leads/Day</strong></li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0" /> 105 Total Leads</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0" /> Priority Queue (3x Faster)</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0" /> 10 Lead Replacements</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0" /> Cost: ₹19/lead only</li>
              </ul>
              <Link to="/login" className="block w-full py-4 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-bold text-center shadow-lg">
                🚀 Get Best Value
              </Link>
            </div>

            {/* Manager - ₹2,999/20 days */}
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:border-slate-600 transition-all flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  👑 PRO
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold mb-2">Manager</h3>
                <p className="text-sm text-slate-400">For Serious Closers</p>
              </div>
              <div className="mb-2">
                <span className="text-sm text-slate-400 line-through">₹4,499</span>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹2,999</span>
                <span className="text-slate-400">/20 days</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> <strong>8 Fresh Leads/Day</strong></li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> 160 Total Leads</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Highest Priority (5x)</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> 16 Lead Replacements</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Dedicated Manager</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-bold text-center">
                Go Premium
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-green-500/20 border border-green-500/30 px-6 py-3 rounded-full">
              <RefreshCw size={24} className="text-green-400" />
              <span className="text-green-300 font-medium">100% Replacement Guarantee for Invalid Numbers.</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-4">
              ❓ FAQ
            </span>
            <h2 className="text-3xl font-bold text-slate-900">Common Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-bold text-slate-800">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Daily Fresh Leads?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 500+ agents who are growing their business with LeadFlow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Zap size={20} /> Get Leads Now
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} /> WhatsApp Support
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">LF</div>
                <span className="font-bold text-white text-lg">LeadFlow</span>
              </div>
              <p className="text-sm">Daily fresh leads for serious agents.</p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="hover:text-white">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/refund" className="hover:text-white">Refund Policy</Link></li>
                <li><Link to="/shipping" className="hover:text-white">Shipping Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li>support@leadflowcrm.in</li>
                <li>+91 {WHATSAPP_NUMBER.replace("91", "")}</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm">
            © 2024 LeadFlow CRM. All rights reserved.
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA - Modern & Clean */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-slate-100 p-3 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-safe-area">
        <div className="flex gap-3 items-center max-w-md mx-auto">
          <Link
            to="/login"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Zap size={18} fill="currentColor" />
            Get Verified Leads
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <MessageCircle size={24} />
          </a>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-1 font-medium">
          ⚡ Setup in 2 Mins • 100% Secure
        </p>
      </div>

      {/* EXIT INTENT POPUP */}
      {showExitPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-bounce-in">
            <button
              onClick={() => setShowExitPopup(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Wait! Don't Miss Out 🎁</h3>
              <p className="text-slate-600 mb-6">
                Jane se pehle yeh special offer claim karein:
                <br />
                <strong className="text-green-600 text-xl">Get 3 EXTRA Leads FREE!</strong>
                <br />
                <span className="text-sm text-slate-500">On your first recharge. No extra cost.</span>
              </p>
              <Link
                to="/login"
                onClick={() => setShowExitPopup(false)}
                className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                Claim My Bonus Leads
              </Link>
              <p className="text-xs text-slate-400 mt-4">
                * Limited time offer. Valid for first purchase only.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Landing;
