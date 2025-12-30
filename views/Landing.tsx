import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, Zap, Shield, ArrowRight, 
  Star, Lock, X, Menu, 
  MessageCircle, Clock, BadgeCheck, IndianRupee,
  Gift, ChevronDown, Bell, Users, Play
} from 'lucide-react';

export const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveLeadsCount, setLiveLeadsCount] = useState(1847);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // WhatsApp Number
  const WHATSAPP_NUMBER = "917009064038";

  // Scroll Progress Indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLeadsCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Smart Exit Intent (Desktop + Mobile + LocalStorage)
  useEffect(() => {
    const exitPopupShown = localStorage.getItem('exitPopupShown');
    if (exitPopupShown) return; // Agar pehle dikh chuka hai to mat dikhao

    // Desktop: Mouse Leave
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !showExitPopup) {
        setShowExitPopup(true);
        localStorage.setItem('exitPopupShown', 'true');
      }
    };

    // Mobile: Show after 20 seconds
    const timer = setTimeout(() => {
      if (!showExitPopup && !exitPopupShown) {
        setShowExitPopup(true);
        localStorage.setItem('exitPopupShown', 'true');
      }
    }, 20000); 

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
    };
  }, [showExitPopup]);

  // Forever Living (FLP) Specific Testimonials
  const testimonials = [
    {
      name: "Rahul Verma",
      role: "Assistant Supervisor (2cc Done)",
      text: "2cc karne ke baad leads ki bohot dikkat thi. LeadFlow se daily 5 fresh leads milti hain. Meri team active ho gayi hai!",
      image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "Sneha Kapoor",
      role: "FLP Manager",
      text: "Manager level par team sambhalna mushkil tha. Is dashboard se main dekh sakti hu kaun call kar raha hai. Best tool for Forever Business.",
      image: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      name: "Amit Singh",
      role: "Supervisor",
      text: "Cold calling se pareshan tha. Ab log khud puchte hain 'Work from home' ke baare mein. Conversion rate 3x ho gaya.",
      image: "https://randomuser.me/api/portraits/men/67.jpg"
    },
    {
      name: "Pooja Mishra",
      role: "Assistant Manager",
      text: "Mere downline mein sab 'Starter Plan' use kar rahe hain. Duplicate karna aasaan ho gaya hai. Sabko result mil raha hai.",
      image: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
      name: "Vikram Gill",
      role: "Soaring Manager",
      text: "Passive income badhani hai to automation zaruri hai. LeadFlow ne meri recruitment process ko automate kar diya.",
      image: "https://randomuser.me/api/portraits/men/22.jpg"
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
      a: "Humare 'Supervisor' aur 'Manager' plan mein Lead Replacement Guarantee milti hai." 
    },
    { 
      q: "Kya main apni purani leads upload kar sakta hu?", 
      a: "Haan, Manager plan mein Bulk Upload aur Team Distribution ka feature available hai." 
    }
  ];

  return (
    <div className="font-sans text-slate-900 overflow-x-hidden bg-white selection:bg-blue-100 selection:text-blue-900">
      
      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-1deg); }
          75% { transform: translateX(2px) rotate(1deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════
          🔔 TOP ANNOUNCEMENT BAR
          ═══════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-medium">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="animate-pulse">🔥</span>
          <span>New User Offer:</span>
          <strong>3 BONUS Leads FREE!</strong>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold hidden sm:inline-block">
            Valid Today Only
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          📍 NAV BAR WITH SCROLL INDICATOR
          ═══════════════════════════════════════════════════════════ */}
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
        {/* Scroll Progress Bar */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 z-50 transition-all" style={{ width: `${scrollProgress}%` }} />

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-3 shadow-xl absolute w-full">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">How it Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">Success Stories</a>
            <Link to="/login" className="block py-2 font-semibold text-slate-600">Login</Link>
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold mt-2">
              Start Free Trial
            </Link>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          🚀 HERO SECTION (FLP OPTIMIZED)
          ═══════════════════════════════════════════════════════════ */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 relative overflow-hidden px-4">
        {/* Background Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] md:w-[1200px] h-[600px] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-3xl opacity-70 -z-10"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
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
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={20} className="group-hover:animate-shake" /> 
                  Get Leads Now
                </Link>
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi,%20I%20want%20to%20know%20about%20Forever%20Leads`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} /> Chat on WhatsApp
                </a>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4,5].map(i => (
                    <img 
                      key={i}
                      src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${20 + i}.jpg`}
                      alt="User"
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    />
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">
                    Used by <strong>500+ FLP Distributors</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Dashboard Preview (Fixed for Tablet) */}
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
                    <Lock size={10} className="text-green-500"/> app.leadflowcrm.in
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-b-xl p-6">
                  {/* Mini Dashboard Preview */}
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
                  
                  {/* Lead Cards Preview */}
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

      {/* ═══════════════════════════════════════════════════════════
          📊 STATS SECTION (NEW)
          ═══════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════
          🔧 HOW IT WORKS SECTION (NEW)
          ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">
              🔧 3 SIMPLE STEPS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Leads pana start karein
            </h2>
            <p className="text-slate-500 text-lg">Koi technical setup nahi. Sirf 2 minute mein shuru.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Plan Choose Karein</h3>
              <p className="text-slate-600">
                Apni requirement ke hisab se daily lead limit select karein (Starter, Supervisor ya Manager).
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/25 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dashboard Payein</h3>
              <p className="text-slate-600">
                Instant access milega aapke personal Dashboard aur Google Sheet ka.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/25 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Calls Shuru Karein</h3>
              <p className="text-slate-600">
                Daily subah 10 baje se fresh leads aani shuru. Call karein aur team badhayein!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ⭐ TESTIMONIALS SLIDESHOW (Infinite Scroll)
          ═══════════════════════════════════════════════════════════ */}
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
          {/* Fading Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

          {/* Marquee Track */}
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-[300px] md:w-[400px] mx-4 flex-shrink-0">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={t.image} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs font-bold text-blue-600 uppercase bg-blue-100 px-2 py-0.5 rounded-full inline-block">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">"{t.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          💰 PRICING PLANS (Synced with Subscription.tsx)
          ═══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-bold mb-4">
              💰 SIMPLE PRICING
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Daily Lead Limit
            </h2>
            <p className="text-slate-400 text-lg">High quality leads at lowest cost.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Starter */}
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:border-slate-600 transition-all flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-sm text-slate-400">For Assistant Supervisors</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹999</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> 2 Fresh Leads/Day</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> ~60 Leads/Month</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> Basic Dashboard</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> WhatsApp Support</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-bold text-center">
                Start Now
              </Link>
            </div>

            {/* Supervisor - Highlighted */}
            <div className="bg-gradient-to-b from-blue-600 to-indigo-700 p-8 rounded-3xl border-2 border-blue-400 transform md:-translate-y-4 shadow-2xl shadow-blue-500/25 flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  ⚡ SUPERVISOR PLAN
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold mb-2">Supervisor</h3>
                <p className="text-sm text-blue-200">For Serious Networkers</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹1,999</span>
                <span className="text-blue-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm font-medium"><CheckCircle size={18} className="text-white flex-shrink-0"/> <strong>6 Fresh Leads/Day</strong></li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0"/> ~180 Leads/Month</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0"/> Lead Replacement Guarantee</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0"/> Performance Analytics</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0"/> Cost: ₹11/lead only</li>
              </ul>
              <Link to="/login" className="block w-full py-4 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-bold text-center shadow-lg">
                🚀 Get Best Value
              </Link>
            </div>

            {/* Manager */}
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:border-slate-600 transition-all flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Manager</h3>
                <p className="text-sm text-slate-400">For Team Leaders</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹4,999</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> 16 Leads/Day</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> ~480 Leads/Month</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> Team Dashboard (5 members)</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> Auto Assignment</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> Priority Support</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-bold text-center">
                Go Premium
              </Link>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-green-500/20 border border-green-500/30 px-6 py-3 rounded-full">
              <Shield size={24} className="text-green-400" />
              <span className="text-green-300 font-medium">7-Day Money Back Guarantee. No questions asked.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ❓ FAQ
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
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

      {/* ═══════════════════════════════════════════════════════════
          🚀 FINAL CTA
          ═══════════════════════════════════════════════════════════ */}
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
              <Zap size={20} /> Start 7-Day Free Trial
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

      {/* ═══════════════════════════════════════════════════════════
          🦶 FOOTER
          ═══════════════════════════════════════════════════════════ */}
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
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Refund Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>support@leadflowcrm.in</li>
                <li>+91 {WHATSAPP_NUMBER.replace("91", "")}</li>
                <li>Gurugram, India</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 text-center text-sm">
            © 2024 LeadFlow CRM. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════
          📱 MOBILE STICKY CTA
          ═══════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <div className="flex gap-2">
          <Link 
            to="/login" 
            className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl font-bold text-sm shadow-lg"
          >
            Start Free Trial
          </Link>
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            className="px-4 bg-green-500 text-white rounded-xl flex items-center justify-center"
          >
            <MessageCircle size={20} />
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          🚪 EXIT INTENT POPUP (PROFIT PSYCHOLOGY)
          ═══════════════════════════════════════════════════════════ */}
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
                <br/>
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

      {/* Animation for popup & marquee */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>

    </div>
  );
};

export default Landing;
