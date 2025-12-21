import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, Zap, BarChart3, Shield, ArrowRight, 
  Star, Lock, Play, Users, Clock, X, Menu, 
  Phone, MessageCircle, TrendingUp, Award, 
  ChevronDown, Sparkles, Target, Bell,
  BadgeCheck, Flame, Gift, Timer, IndianRupee
} from 'lucide-react';

export const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveLeadsCount, setLiveLeadsCount] = useState(1847);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Live counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLeadsCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Exit intent popup (desktop only)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !showExitPopup) {
        setShowExitPopup(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitPopup]);

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Insurance Agent, Delhi",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "Pehle din mein 50 leads forward karta tha manually. Ab sab automatic hai. Team ki productivity 3x ho gayi!",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "Real Estate, Mumbai",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "₹16 per lead mil rahi hai quality leads. Pehle ₹50+ lagta tha. ROI amazing hai!",
      rating: 5
    },
    {
      name: "Amit Patel",
      role: "Network Marketing, Ahmedabad",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
      text: "Meri team ab daily targets hit karti hai. Manager dashboard se sab track hota hai live.",
      rating: 5
    }
  ];

  const faqs = [
    { 
      q: "Leads kahan se aati hain?", 
      a: "Facebook & Google Ads se verified leads aati hain. Sab fresh hoti hain, recycled nahi." 
    },
    { 
      q: "Kya main apni purani leads upload kar sakta hu?", 
      a: "Haan, Manager plan mein Bulk Upload feature available hai." 
    },
    { 
      q: "Payment ke baad setup mein kitna time lagta hai?", 
      a: "0 Minutes. Sign up karte hi dashboard ready ho jata hai. Instant access!" 
    },
    { 
      q: "Kya refund milta hai?", 
      a: "7 days money back guarantee. Agar satisfied nahi, full refund no questions asked." 
    },
    { 
      q: "WhatsApp pe leads aati hain?", 
      a: "Haan! Dashboard ke saath-saath WhatsApp notification bhi milti hai har lead ki." 
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
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out infinite; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════
          🔔 TOP ANNOUNCEMENT BAR
          ═══════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 text-center text-sm font-medium">
        <span className="animate-pulse">🔥</span>
        {" "}Limited Time: First 100 Users Get <strong>₹200 OFF</strong> + 3 Bonus Leads FREE!
        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
          47 spots left
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          📍 NAV BAR
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
              <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">कैसे काम करता है</a>
              <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Reviews</a>
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/login" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                Start Free <ArrowRight size={16} />
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-600 p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-3 shadow-xl">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">कैसे काम करता है</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-semibold text-slate-600">Reviews</a>
            <Link to="/login" className="block py-2 font-semibold text-slate-600">Login</Link>
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold mt-2">
              Start Free Trial
            </Link>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          🚀 HERO SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 relative overflow-hidden px-4">
        {/* Background Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] md:w-[1200px] h-[600px] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-3xl opacity-70 -z-10"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Live Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-bold mb-6">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                {liveLeadsCount.toLocaleString()} leads distributed today
              </div>
              
              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                रोज़ाना <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Fresh Leads</span>
                <br />
                <span className="text-3xl md:text-4xl lg:text-5xl">Automatically आपके Dashboard में</span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                Manual forwarding बंद करो। 
                <strong className="text-slate-800"> ₹16/lead</strong> में quality leads सीधे 
                आपके Dashboard + WhatsApp पर।
              </p>

              {/* Trust Points */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={18} className="text-green-500" />
                  <span>No Setup Fee</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={18} className="text-green-500" />
                  <span>7-Day Money Back</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={18} className="text-green-500" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link 
                  to="/login" 
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={20} className="group-hover:animate-shake" /> 
                  Start 7-Day Free Trial
                </Link>
                <a 
                  href="https://wa.me/919876543210?text=Hi,%20I%20want%20to%20know%20about%20LeadFlow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} /> WhatsApp पर बात करें
                </a>
              </div>

              {/* Social Proof Micro */}
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
                    <strong>500+</strong> agents trust LeadFlow
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Dashboard Preview */}
            <div className="relative animate-float hidden lg:block">
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
                      <p className="text-xs text-slate-500 mb-1">Closed</p>
                      <p className="text-2xl font-bold text-purple-600">2</p>
                    </div>
                  </div>
                  
                  {/* Lead Cards Preview */}
                  <div className="space-y-2">
                    {['Rahul Verma', 'Priya Singh', 'Amit Kumar'].map((name, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                            {name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-800">{name}</p>
                            <p className="text-xs text-slate-500">Delhi • Just now</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">Fresh</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -right-4 top-1/4 bg-white px-4 py-2 rounded-lg shadow-lg border border-slate-200 animate-bounce">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold">New Lead! 🔥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          🏆 TRUST BADGES
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 text-slate-500">
              <Shield size={24} className="text-green-500" />
              <span className="text-sm font-medium">SSL Secure</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <BadgeCheck size={24} className="text-blue-500" />
              <span className="text-sm font-medium">Verified Business</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <IndianRupee size={24} className="text-orange-500" />
              <span className="text-sm font-medium">UPI & Cards Accepted</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Clock size={24} className="text-purple-500" />
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          📊 PROBLEM → SOLUTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold mb-4">
              😫 THE PROBLEM
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              क्या आप भी इन Problems से परेशान हैं?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Problems */}
            <div className="space-y-4">
              {[
                "WhatsApp पर manually leads forward करना",
                "Team track नहीं होती - कौन call कर रहा है?",
                "Excel sheets में leads खो जाती हैं",
                "महंगी leads खरीदो फिर भी conversion कम"
              ].map((problem, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <X size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-700">{problem}</p>
                </div>
              ))}
            </div>

            {/* Solutions */}
            <div className="space-y-4">
              {[
                "Auto-assignment: Leads सीधे agent के dashboard में",
                "Live Tracking: Manager देखे कौन call कर रहा है",
                "CRM Dashboard: सब एक जगह, कुछ नहीं खोता",
                "₹16/lead: Quality leads at lowest cost"
              ].map((solution, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                  <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-700">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          🔄 HOW IT WORKS
          ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">
              ⚡ HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              3 Simple Steps में शुरू करें
            </h2>
            <p className="text-slate-500 text-lg">Setup में 2 minute लगते हैं। फिर leads automatic आती हैं।</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200"></div>

            {[
              {
                step: "1",
                icon: "📱",
                title: "Sign Up करें",
                desc: "2 minute में account बनाएं। कोई documents नहीं चाहिए।",
                color: "blue"
              },
              {
                step: "2",
                icon: "🎯",
                title: "Plan Choose करें",
                desc: "अपने budget के हिसाब से daily lead limit set करें।",
                color: "indigo"
              },
              {
                step: "3",
                icon: "🚀",
                title: "Leads पाएं",
                desc: "रोज़ सुबह 9 बजे fresh leads आपके dashboard में!",
                color: "purple"
              }
            ].map((item, i) => (
              <div key={i} className="relative bg-white p-8 rounded-2xl border border-slate-200 text-center hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl">
                <div className={`w-20 h-20 bg-${item.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl border-4 border-white shadow-lg relative z-10`}>
                  {item.icon}
                </div>
                <div className="absolute top-6 right-6 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ⭐ TESTIMONIALS
          ═══════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">
              ⭐ TESTIMONIALS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              500+ Agents का भरोसा
            </h2>
            <p className="text-slate-500 text-lg">देखिए हमारे users क्या कहते हैं</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={18} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          💰 PRICING
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
            <p className="text-slate-400 text-lg">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Starter */}
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:border-slate-600 transition-all flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-sm text-slate-400">For solo agents</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹999</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> 2 Leads/Day</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> ~60 Leads/Month</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> Dashboard Access</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> WhatsApp Alerts</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-bold text-center">
                Start Free Trial
              </Link>
            </div>

            {/* Pro - Highlighted */}
            <div className="bg-gradient-to-b from-blue-600 to-indigo-700 p-8 rounded-3xl border-2 border-blue-400 transform md:-translate-y-4 shadow-2xl shadow-blue-500/25 flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  ⚡ MOST POPULAR
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold mb-2">Supervisor</h3>
                <p className="text-sm text-blue-200">Best value for serious agents</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹1,999</span>
                <span className="text-blue-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm font-medium"><CheckCircle size={18} className="text-white flex-shrink-0"/> <strong>6 Leads/Day</strong></li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0"/> ~180 Leads/Month</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0"/> Priority Support</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0"/> Call Recording</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-white flex-shrink-0"/> Export Reports</li>
              </ul>
              <Link to="/login" className="block w-full py-4 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-bold text-center shadow-lg">
                🚀 Start Free Trial
              </Link>
            </div>

            {/* Manager */}
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:border-slate-600 transition-all flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Manager</h3>
                <p className="text-sm text-slate-400">For team leaders</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-black">₹4,999</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> 16 Leads/Day</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> ~480 Leads/Month</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> Team Management</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> Auto Lead Assignment</li>
                <li className="flex gap-2 text-sm"><CheckCircle size={18} className="text-green-400 flex-shrink-0"/> Analytics Dashboard</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-bold text-center">
                Start Free Trial
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
              href="https://wa.me/919876543210"
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
                <li>+91 98765 43210</li>
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
            href="https://wa.me/919876543210"
            className="px-4 bg-green-500 text-white rounded-xl flex items-center justify-center"
          >
            <MessageCircle size={20} />
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          🚪 EXIT INTENT POPUP
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
              <h3 className="text-2xl font-bold text-slate-900 mb-2">रुकिए! 🎁</h3>
              <p className="text-slate-600 mb-6">
                जाने से पहले यह special offer लीजिए:
                <br />
                <strong className="text-red-600 text-xl">₹200 OFF + 5 Bonus Leads FREE!</strong>
              </p>
              <Link 
                to="/login"
                onClick={() => setShowExitPopup(false)}
                className="block w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-red-600 hover:to-orange-600 transition-all"
              >
                Claim My Discount Now
              </Link>
              <p className="text-xs text-slate-400 mt-4">
                * Limited time offer. Valid for first purchase only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Animation for popup */}
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
