import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, Zap, BarChart3, Shield, ArrowRight, 
  Star, Lock, Server, Play, Users, Globe, Layout, 
  Smartphone, Database, Clock, Menu, X, ChevronDown
} from 'lucide-react';

export const Landing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="font-sans text-slate-900 overflow-x-hidden bg-white selection:bg-blue-100 selection:text-blue-900">
      
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
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">LF</div>
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-900">LeadFlow</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                Get Started <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-600">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-xl absolute w-full">
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block font-semibold text-slate-600">Pricing</a>
            <Link to="/login" className="block font-semibold text-slate-600">Login</Link>
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold">Get Started</Link>
          </div>
        )}
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden px-4">
        {/* Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] md:w-[1000px] h-[500px] bg-blue-50 rounded-full blur-[100px] opacity-60 -z-10"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-100 text-blue-700 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            New: Auto-Assignment Engine v2.0
          </div>
          
          <h1 className="text-4xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
            Stop Managing Leads on<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Excel Sheets</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
            Distribute Facebook & Google leads to your sales team in <span className="font-bold text-slate-900 bg-yellow-100 px-1">under 1 second</span>. Increase conversion by 40% instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Zap size={20} className="fill-current" /> Start Free Trial
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Play size={20} className="fill-slate-700" /> Watch Demo
            </button>
          </div>

          {/* Screenshot Mockup (Mobile Optimized) */}
          <div className="relative mx-auto max-w-[95%] md:max-w-5xl group animate-float">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-slate-900 rounded-xl md:rounded-2xl shadow-2xl border border-slate-800 p-1 md:p-2 overflow-hidden ring-1 ring-white/10">
               {/* Browser Bar */}
               <div className="h-6 md:h-10 bg-slate-800 rounded-t-lg md:rounded-t-xl flex items-center px-2 md:px-4 gap-2 mb-1 border-b border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="ml-2 md:ml-4 px-2 md:px-4 py-0.5 md:py-1.5 bg-slate-950 rounded-md text-[8px] md:text-[11px] text-slate-400 font-mono w-40 md:w-80 flex justify-between items-center border border-slate-700">
                    <span className="flex items-center gap-1"><Lock size={8} className="text-green-500"/> app.leadflow.in</span>
                  </div>
               </div>
               
               {/* Dashboard Image Placeholder */}
               <div className="bg-slate-50 rounded-b-lg md:rounded-b-xl aspect-[16/10] md:aspect-[16/9] relative overflow-hidden flex flex-col items-center justify-center border-t border-slate-200">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <BarChart3 size={24} className="text-blue-600 md:w-8 md:h-8" />
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-slate-900 mb-1">Live Dashboard Preview</h3>
                    <p className="text-xs md:text-sm text-slate-500">(Your Dashboard Screenshot Here)</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SOCIAL PROOF ================= */}
      <section className="py-8 md:py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Trusted by fast-growing teams</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <h3 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2"><Globe size={20}/> GlobalTech</h3>
            <h3 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2"><Layout size={20}/> FrameWork</h3>
            <h3 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2"><Zap size={20}/> BoltShift</h3>
          </div>
        </div>
      </section>

      {/* ================= PRICE COMPARISON (The Hook) ================= */}
      <section className="py-16 md:py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Why Pay More?</h2>
            <p className="text-slate-500">Stop burning money on complex enterprise software.</p>
          </div>

          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="grid md:grid-cols-2">
              
              {/* Left: Traditional (Expensive) */}
              <div className="p-8 md:p-10 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center items-center text-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Traditional CRMs</h3>
                <p className="text-sm font-medium text-slate-400 mb-6">(Salesforce, Zoho, HubSpot)</p>
                
                <div className="space-y-3 mb-8 w-full max-w-xs">
                  <div className="flex items-center justify-between text-slate-500 text-sm">
                    <span className="flex items-center gap-2"><Users size={14}/> 20 Users Limit</span>
                    <span className="line-through decoration-red-400 text-red-400 font-bold">Expensive</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-sm">
                    <span className="flex items-center gap-2"><Database size={14}/> Setup Fee</span>
                    <span className="line-through decoration-red-400 text-red-400 font-bold">₹50,000+</span>
                  </div>
                </div>

                <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-inner w-full max-w-xs">
                  <span className="text-2xl md:text-3xl font-bold text-slate-400">₹80,000+</span>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wide">/month total</span>
                </div>
              </div>

              {/* Right: LeadFlow (Winner) */}
              <div className="p-8 md:p-10 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-green-400 text-green-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg animate-pulse">
                  Save 90%
                </div>

                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">LeadFlow Manager</h3>
                <p className="text-sm font-medium text-blue-100 mb-6">Built for Speed & Volume</p>
                
                <div className="space-y-3 mb-8 w-full max-w-xs text-blue-50 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><CheckCircle size={14}/> Unlimited Users</span>
                    <span className="text-green-300 font-bold">Included</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Zap size={14}/> Setup Fee</span>
                    <span className="text-green-300 font-bold">₹0 Free</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 shadow-xl w-full max-w-xs">
                  <span className="text-4xl md:text-5xl font-extrabold text-white">₹4,999</span>
                  <span className="text-[10px] text-blue-200 block uppercase tracking-wide">/month flat rate</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= PRICING PLANS ================= */}
      <section id="pricing" className="py-20 md:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900">Choose Your Plan</h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto text-sm md:text-base">
            Whether you are a solo agent or managing a team, we have you covered.
          </p>

          {/* Toggle Switch */}
          <div className="flex justify-center items-center gap-4 mb-12 cursor-pointer" onClick={() => setIsAnnual(!isAnnual)}>
            <span className={`text-sm font-bold ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <div className={`w-14 h-8 bg-slate-900 rounded-full p-1 flex items-center transition-all duration-300`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            <span className={`text-sm font-bold ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>
              Yearly <span className="text-green-600 text-xs ml-1">(20% Off)</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* 1. SOLO AGENT */}
            <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-300 transition-all hover:shadow-lg flex flex-col text-left">
              <h3 className="font-bold text-xl mb-1 text-slate-800">Solo Agent</h3>
              <p className="text-slate-500 text-xs mb-6">For individual performers.</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">₹{isAnnual ? '799' : '999'}</span>
                <span className="text-slate-400 text-sm">/mo</span>
              </div>
              <Link to="/signup?role=member" className="w-full py-3 border-2 border-slate-100 text-slate-700 rounded-xl font-bold hover:border-slate-900 hover:text-slate-900 transition-all mb-8 text-center block">
                Start Solo
              </Link>
              <ul className="space-y-3 text-sm flex-1">
                <li className="flex gap-3"><CheckCircle size={16} className="text-blue-500 shrink-0"/> Personal Dashboard</li>
                <li className="flex gap-3"><CheckCircle size={16} className="text-blue-500 shrink-0"/> Daily Lead Limit: 5</li>
                <li className="flex gap-3"><CheckCircle size={16} className="text-blue-500 shrink-0"/> Personal Google Sheet</li>
              </ul>
            </div>

            {/* 2. TEAM MANAGER (Hero) */}
            <div className="p-6 md:p-8 bg-slate-900 text-white rounded-3xl shadow-2xl transform md:scale-105 relative border border-slate-800 ring-4 ring-blue-500/30 z-10 flex flex-col text-left">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-[10px] font-bold px-4 py-1 rounded-full text-white shadow-lg uppercase tracking-wider whitespace-nowrap">
                 Recommended for Leaders
              </div>
              
              <h3 className="font-bold text-xl mb-1 text-blue-300 mt-2">Team Manager</h3>
              <p className="text-slate-400 text-xs mb-6">Automate your entire team.</p>
              <div className="mb-6">
                 <span className="text-4xl md:text-5xl font-extrabold">₹{isAnnual ? '3999' : '4999'}</span>
                 <span className="text-slate-400 text-sm">/mo</span>
              </div>
              
              <Link to="/signup?role=manager" className="w-full py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg text-center block mb-8">
                Create Team Now
              </Link>
              
              <ul className="space-y-3 text-sm font-medium flex-1">
                <li className="flex gap-3 text-white"><CheckCircle size={16} className="text-blue-400 shrink-0"/> <strong>Everything in Solo</strong></li>
                <li className="flex gap-3 text-blue-100"><CheckCircle size={16} className="text-blue-400 shrink-0"/> Auto-Assign Leads (Round Robin)</li>
                <li className="flex gap-3 text-blue-100"><CheckCircle size={16} className="text-blue-400 shrink-0"/> Manager "Spy View" Dashboard</li>
                <li className="flex gap-3 text-blue-100"><CheckCircle size={16} className="text-blue-400 shrink-0"/> Unlimited Members</li>
              </ul>
            </div>

            {/* 3. ENTERPRISE */}
            <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-300 transition-all hover:shadow-lg flex flex-col text-left">
              <h3 className="font-bold text-xl mb-1 text-slate-800">Agency</h3>
              <p className="text-slate-500 text-xs mb-6">For multiple teams.</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">Custom</span>
              </div>
              <a href="mailto:sales@leadflowcrm.in" className="w-full py-3 border-2 border-slate-100 text-slate-700 rounded-xl font-bold hover:border-slate-900 hover:text-slate-900 transition-all mb-8 text-center block">
                Contact Sales
              </a>
              <ul className="space-y-3 text-sm flex-1">
                <li className="flex gap-3"><CheckCircle size={16} className="text-slate-400 shrink-0"/> Multiple Manager Accounts</li>
                <li className="flex gap-3"><CheckCircle size={16} className="text-slate-400 shrink-0"/> Custom Domain (White Label)</li>
                <li className="flex gap-3"><CheckCircle size={16} className="text-slate-400 shrink-0"/> Priority Support</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ================= ANIMATED TESTIMONIALS ================= */}
      <section className="py-20 md:py-24 bg-slate-50 overflow-hidden">
        <div className="text-center mb-12 px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Loved by 1,000+ Leaders</h2>
            <p className="text-slate-500 mt-2">Real reviews from real users.</p>
        </div>

        {/* Marquee */}
        <div className="relative w-full">
            <div className="flex w-max animate-scroll gap-6 px-4">
                {[...testimonials, ...testimonials].map((t, i) => (
                    <div key={i} className="w-[300px] md:w-[350px] bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                        <div className="flex gap-1 mb-3">
                            {[...Array(5)].map((_, idx) => (
                                <Star key={idx} size={14} className="text-yellow-400 fill-yellow-400" />
                            ))}
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed mb-4 font-medium line-clamp-3">"{t.quote}"</p>
                        <div className="flex items-center gap-3">
                            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* ================= FULL FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-12 md:py-16 border-t border-slate-900 text-sm">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
           <div className="col-span-2 md:col-span-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">LF</div>
                <span className="font-bold text-white text-xl">LeadFlow</span>
             </div>
             <p className="leading-relaxed mb-6 opacity-80 text-xs md:text-sm">
               Automating sales distribution for India's fastest growing teams.
             </p>
             <div className="flex gap-4">
                <SocialIcon><Users size={16}/></SocialIcon>
                <SocialIcon><Globe size={16}/></SocialIcon>
             </div>
           </div>

           <div>
             <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Platform</h4>
             <ul className="space-y-2 text-xs md:text-sm">
               <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
               <li><Link to="/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Legal</h4>
             <ul className="space-y-2 text-xs md:text-sm">
               <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Refund Policy</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Shipping Policy</a></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Contact</h4>
             <ul className="space-y-2 text-xs md:text-sm">
               <li><a href="mailto:support@leadflow.app" className="hover:text-blue-400 transition-colors">support@leadflow.app</a></li>
               <li><p>Gurugram, Haryana</p></li>
               <li><p>India</p></li>
             </ul>
           </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-900 text-center md:text-left text-xs text-slate-600">
          <p>© 2024 LeadFlow SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// 👇 Components & Data
const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all group">
    <div className="mb-4 p-3 bg-white rounded-xl inline-block shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const SocialIcon = ({ children }: any) => (
  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
    {children}
  </div>
);

// ✅ UPDATED TESTIMONIALS (With Correct Image Matching)
// I have used consistent Pravatar IDs for realistic Indian faces
const testimonials = [
    {
        name: "Rahul Sharma",
        role: "Team Leader, Forever Living",
        img: "https://i.pravatar.cc/150?img=11", // Indian Male
        quote: "Before LeadFlow, we wasted 4 hours daily assigning leads manually. Now it's instant. Sales up by 40%!"
    },
    {
        name: "Priya Singh",
        role: "Supervisor, Forever Living",
        img: "https://i.pravatar.cc/150?img=5", // Indian Female
        quote: "The 'Spy View' is a game changer. I know exactly who is working. Highly recommended for remote teams."
    },
    {
        name: "Amit Verma",
        role: "Manager, Forever Living",
        img: "https://i.pravatar.cc/150?img=13", // Indian Male
        quote: "Simple UI. My team understood it in 10 minutes. No complex training needed. Best investment."
    },
    {
        name: "Sneha Gupta",
        role: "Beginner, Forever Living",
        img: "https://i.pravatar.cc/150?img=9", // Indian Female
        quote: "Support is amazing. They helped me set up my Google Sheet in 5 minutes. Saves so much time."
    }
];

export default Landing;
