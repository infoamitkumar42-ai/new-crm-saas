import React from 'react';
import { Link } from 'react-router-dom';
// 👇 Added 'Globe' to imports
import { CheckCircle, Zap, BarChart3, Shield, ArrowRight, Star, Lock, Server, Play, Users, Globe } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="font-sans text-slate-900 overflow-x-hidden">
      
      {/* 👇 CSS for Marquee Animation */}
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
      `}</style>

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

      {/* ================= HERO SECTION ================= */}
      <section className="pt-32 pb-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in hover:bg-blue-100 transition-colors cursor-pointer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: WhatsApp Automation Added
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
            Turn Your Excel Sheets<br />
            Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Money Machine</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop losing leads manually. Distribute Facebook & Google leads to your team in <span className="font-bold text-slate-900">under 1 second</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all">
              Start Free Trial
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Play size={20} className="fill-slate-700" /> Watch Demo
            </button>
          </div>

          {/* Screenshot Mockup */}
          <div className="relative mx-auto max-w-5xl group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 overflow-hidden">
               <div className="h-8 bg-slate-800 rounded-t-xl flex items-center px-4 gap-2 mb-1">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-slate-700 rounded-md text-[10px] text-slate-400 font-mono w-64 flex justify-between items-center">
                    <span>leadflow.app/dashboard</span>
                    <Lock size={8} />
                  </div>
               </div>
               
               {/* 📸 REPLACE THIS DIV WITH YOUR IMG TAG */}
               <div className="bg-white rounded-b-xl aspect-[16/9] flex items-center justify-center relative overflow-hidden">
                  <div className="text-center z-10">
                    <BarChart3 size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold text-lg">Dashboard Preview</p>
                    <p className="text-xs text-slate-400 mt-2">(Put your screenshot here)</p>
                  </div>
                  {/* Grid Pattern */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ANIMATED TESTIMONIALS (MARQUEE) ================= */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="text-center mb-16 px-4">
            <h2 className="text-3xl font-bold text-slate-900">Loved by 1,000+ Sales Leaders</h2>
            <p className="text-slate-500 mt-2">See why top teams are switching to LeadFlow.</p>
        </div>

        {/* The Marquee Container */}
        <div className="relative w-full">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
            
            <div className="flex w-max animate-scroll gap-6 px-4">
                {/* We render list TWICE for seamless loop */}
                {[...testimonials, ...testimonials].map((t, i) => (
                    <div key={i} className="w-[350px] bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex-shrink-0">
                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, idx) => (
                                <Star key={idx} size={16} className="text-yellow-400 fill-yellow-400" />
                            ))}
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed mb-6 line-clamp-3">"{t.quote}"</p>
                        <div className="flex items-center gap-3">
                            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                                <p className="text-xs text-slate-500">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* ================= PRICING (Psychology Optimized) ================= */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase mb-4">
             Limited Time Deal
          </div>
          <h2 className="text-4xl font-bold mb-4 text-slate-900">Simple Pricing. No Surprises.</h2>
          <p className="text-slate-500 mb-12 max-w-xl mx-auto">
            Pay only for what you use. Cancel anytime. No hidden setup fees.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            
            {/* 1. Free Plan (Anchor Low) */}
            <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 transition-all">
              <h3 className="font-bold text-xl mb-2 text-slate-800">Starter</h3>
              <p className="text-4xl font-extrabold mb-2 text-slate-900">₹0</p>
              <p className="text-slate-400 text-sm mb-8">Forever Free</p>
              <ul className="text-left space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-slate-400"/> 1 Manager</li>
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-slate-400"/> 5 Leads / Day</li>
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-slate-400"/> Basic Dashboard</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:border-slate-900 hover:text-slate-900 transition-all">Start Free</Link>
            </div>

            {/* 2. Pro Plan (The Hero - Psychology) */}
            <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-2xl transform scale-105 relative border border-slate-700 ring-4 ring-blue-500/20">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-xs font-bold px-4 py-1 rounded-full text-white shadow-lg uppercase tracking-wider">
                 Most Popular
              </div>
              
              <h3 className="font-bold text-xl mb-2 text-blue-300 mt-2">Pro Manager</h3>
              <div className="flex justify-center items-end gap-3 mb-2">
                 <p className="text-5xl font-extrabold">₹499</p>
                 <span className="text-slate-500 text-xl line-through mb-1 decoration-red-500/50 decoration-2">₹1999</span>
              </div>
              <p className="text-slate-400 text-sm mb-8">/month per member</p>
              
              <div className="h-px bg-slate-800 mb-8"></div>
              
              <ul className="text-left space-y-4 mb-8 text-sm font-medium">
                <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400"/></div> <span><strong>Unlimited</strong> Leads</span></li>
                <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400"/></div> <span>Manager "Spy" View</span></li>
                <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400"/></div> <span>WhatsApp Integration</span></li>
                <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400"/></div> <span>Priority Support</span></li>
              </ul>
              <Link to="/login" className="block w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50">
                Get Started Now
              </Link>
              <p className="text-[10px] text-center mt-4 text-slate-500 opacity-70">30-day money-back guarantee</p>
            </div>

            {/* 3. Business (Anchor High) */}
            <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 transition-all">
              <h3 className="font-bold text-xl mb-2 text-slate-800">Enterprise</h3>
              <p className="text-4xl font-extrabold mb-2 text-slate-900">₹999</p>
              <p className="text-slate-400 text-sm mb-8">/month per member</p>
              <ul className="text-left space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-slate-400"/> Everything in Pro</li>
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-slate-400"/> Custom API Access</li>
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-slate-400"/> Dedicated Account Manager</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:border-slate-900 hover:text-slate-900 transition-all">Contact Sales</Link>
            </div>

          </div>
        </div>
      </section>

      {/* ================= TRUST FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 text-sm">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12">
           <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">LF</div>
                <span className="font-bold text-white text-xl">LeadFlow</span>
             </div>
             <p className="leading-relaxed mb-6 opacity-80">
               Automating sales for India's fastest growing teams.
             </p>
             <div className="flex gap-4">
                <div className="bg-slate-900 p-2 rounded-lg hover:bg-slate-800 cursor-pointer"><Users size={16}/></div>
                <div className="bg-slate-900 p-2 rounded-lg hover:bg-slate-800 cursor-pointer"><Globe size={16}/></div>
             </div>
           </div>

           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Platform</h4>
             <ul className="space-y-3">
               <li><a href="#" className="hover:text-blue-400 transition-colors">How it Works</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Testimonials</a></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Legal</h4>
             <ul className="space-y-3">
               <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Refund Policy</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">SLA Agreement</a></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Contact</h4>
             <ul className="space-y-3">
               <li><a href="mailto:support@leadflow.app" className="hover:text-blue-400 transition-colors">support@leadflow.app</a></li>
               <li><p>Haryana, India</p></li>
               <li className="pt-4 flex items-center gap-2 text-xs text-green-500">
                  <Lock size={12}/> Secure 256-bit SSL
               </li>
             </ul>
           </div>
        </div>
      </footer>
    </div>
  );
};

// 👇 DATA: Testimonials for the Marquee
const testimonials = [
    {
        name: "Rahul Sharma",
        role: "Team Leader, Bajaj Finance",
        img: "https://i.pravatar.cc/150?u=rahul",
        quote: "Before LeadFlow, we wasted 4 hours daily assigning leads manually on Excel. Now it's instant. Sales up by 40% in just 2 months!"
    },
    {
        name: "Priya Singh",
        role: "Sales Manager, Byju's",
        img: "https://i.pravatar.cc/150?u=priya",
        quote: "The 'Spy View' is a game changer. I know exactly who is working and who is slacking. Highly recommended for remote teams."
    },
    {
        name: "Amit Verma",
        role: "Real Estate Broker",
        img: "https://i.pravatar.cc/150?u=amit",
        quote: "Simple UI. My team understood it in 10 minutes. No complex training needed. Best investment for my agency."
    },
    {
        name: "Sneha Gupta",
        role: "Agency Owner",
        img: "https://i.pravatar.cc/150?u=sneha",
        quote: "Support is amazing. They helped me set up my Google Sheet in 5 minutes. The WhatsApp click-to-chat feature saves so much time."
    },
    {
        name: "Vikram Malhotra",
        role: "Insurance Agent",
        img: "https://i.pravatar.cc/150?u=vikram",
        quote: "I tried 5 other CRMs, but they were too expensive and complicated. LeadFlow is exactly what I needed. Cheap and Fast."
    },
    {
        name: "Arjun Das",
        role: "Marketing Head",
        img: "https://i.pravatar.cc/150?u=arjun",
        quote: "The round-robin distribution is flawless. No more fights in the team about who gets the better leads. Everything is fair now."
    }
];
