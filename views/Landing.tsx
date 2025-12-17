import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, Zap, BarChart3, Shield, ArrowRight, 
  Star, Lock, Server, Play, Users, Globe, Layout, 
  Smartphone, Database, Clock
} from 'lucide-react';

export const Landing = () => {
  return (
    <div className="font-sans text-slate-900 overflow-x-hidden bg-white selection:bg-blue-100 selection:text-blue-900">
      
      {/* 🚀 ANIMATIONS */}
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
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
        }
      `}</style>

      {/* ================= NAV BAR ================= */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-lg z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">LF</div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">LeadFlow</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 hidden md:block transition-colors">
                Login
              </Link>
              <Link to="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 group">
                Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="pt-36 pb-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-50 -z-10"></div>
        <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-purple-100 rounded-full blur-[100px] opacity-30 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-8 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            New: Auto-Assignment Engine v2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
            Stop Managing Leads on<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Excel Sheets</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Distribute Facebook & Google leads to your sales team in <span className="font-bold text-slate-900 bg-yellow-100 px-1">under 1 second</span>. Increase conversion by 40% instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Zap size={20} className="fill-current" /> Start Free Trial
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm">
              <Play size={20} className="fill-slate-700" /> Watch Demo
            </button>
          </div>

          {/* Screenshot Mockup */}
          <div className="relative mx-auto max-w-5xl group animate-float">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 overflow-hidden ring-1 ring-white/10">
               <div className="h-10 bg-slate-800 rounded-t-xl flex items-center px-4 gap-2 mb-1 border-b border-slate-700">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="ml-4 px-4 py-1.5 bg-slate-950 rounded-md text-[11px] text-slate-400 font-mono w-80 flex justify-between items-center border border-slate-700">
                    <span className="flex items-center gap-2"><Lock size={10} className="text-green-500"/> app.leadflow.in/dashboard</span>
                    <div className="flex gap-1"><div className="w-1 h-1 bg-slate-500 rounded-full"></div><div className="w-1 h-1 bg-slate-500 rounded-full"></div></div>
                  </div>
               </div>
               
               {/* 📸 Dashboard Preview */}
               <div className="bg-slate-50 rounded-b-xl aspect-[16/9] relative overflow-hidden flex flex-col items-center justify-center border-t border-slate-200">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3')] bg-cover bg-center opacity-10 blur-sm"></div>
                  <div className="z-10 text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 shadow-xl max-w-lg">
                    <BarChart3 size={48} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Live Dashboard Preview</h3>
                    <p className="text-sm text-slate-500 mb-6">Real-time lead tracking, team performance, and instant distribution logic visualized.</p>
                    <Link to="/login" className="text-blue-600 font-bold hover:underline text-sm flex items-center justify-center gap-1">
                      See Live Demo <ArrowRight size={14}/>
                    </Link>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SOCIAL PROOF STRIP ================= */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by fast-growing teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Fake Logos for Design - Replace with SVG logos later */}
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Globe size={24}/> GlobalTech</h3>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Layout size={24}/> FrameWork</h3>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Zap size={24}/> BoltShift</h3>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BoxIcon/> CubeSpace</h3>
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Why Managers Love Us?</h2>
            <p className="text-lg text-slate-500">We solved the biggest problem in sales: <span className="text-slate-900 font-semibold">Speed to Lead</span>.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Clock className="text-blue-600" size={32} />}
              title="Instant Distribution"
              desc="Leads land in your Google Sheet → Assigned to agent within 0.5 seconds. No manual copy-pasting."
            />
            <FeatureCard 
              icon={<Database className="text-purple-600" size={32} />}
              title="Fair Allocation"
              desc="Round-robin algorithm ensures every team member gets equal leads. Or prioritize top performers."
            />
            <FeatureCard 
              icon={<Smartphone className="text-green-600" size={32} />}
              title="Mobile Friendly"
              desc="Agents get leads on their phone dashboard with one-click WhatsApp & Calling buttons."
            />
            <FeatureCard 
              icon={<Shield className="text-orange-600" size={32} />}
              title="Data Security"
              desc="Agents only see their own leads. Managers see everything. Prevent data theft instantly."
            />
            <FeatureCard 
              icon={<Users className="text-pink-600" size={32} />}
              title="Team Tracking"
              desc="Spy view lets you see who is calling and who is slacking. Daily performance reports."
            />
            <FeatureCard 
              icon={<Layout className="text-cyan-600" size={32} />}
              title="Google Sheet Sync"
              desc="Everything syncs back to your Master Sheet. You own your data, always."
            />
          </div>
        </div>
      </section>

      {/* ================= ANIMATED TESTIMONIALS (MARQUEE) ================= */}
      <section className="py-24 bg-slate-50 overflow-hidden relative">
        <div className="text-center mb-16 px-4 relative z-10">
            <h2 className="text-3xl font-bold text-slate-900">Loved by 1,000+ Sales Leaders</h2>
            <p className="text-slate-500 mt-2">See why top teams are switching to LeadFlow.</p>
        </div>

        {/* Gradient Overlay for Fade Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
        
        {/* The Marquee Container */}
        <div className="flex w-max animate-scroll gap-6 px-4 hover:pause">
            {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="w-[400px] bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex-shrink-0 cursor-default">
                    <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, idx) => (
                            <Star key={idx} size={18} className="text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <p className="text-slate-700 text-base leading-relaxed mb-6 font-medium">"{t.quote}"</p>
                    <div className="flex items-center gap-4 border-t border-slate-50 pt-4">
                        <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div>
                            <h4 className="font-bold text-slate-900">{t.name}</h4>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{t.role}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* ================= PRICING SECTION ================= */}
      <section id="pricing" className="py-24 bg-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4 text-slate-900">Simple Pricing. No Surprises.</h2>
          <p className="text-slate-500 mb-12 max-w-xl mx-auto">
            Start for free. Upgrade as you grow. No credit card required for trial.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            
            {/* 1. Starter (Anchor Low) */}
            <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 transition-all hover:shadow-lg">
              <h3 className="font-bold text-xl mb-2 text-slate-800">Starter</h3>
              <div className="flex justify-center items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                <span className="text-slate-400">/forever</span>
              </div>
              <p className="text-slate-500 text-sm mb-8 px-4">Perfect for individual agents just starting out.</p>
              <ul className="text-left space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-blue-500"/> 1 Manager Account</li>
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-blue-500"/> 5 Leads / Day</li>
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-blue-500"/> Basic Dashboard</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:border-slate-900 hover:text-slate-900 transition-all">Start Free</Link>
            </div>

            {/* 2. Pro Plan (The Hero) */}
            <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-2xl transform md:scale-110 relative border border-slate-800 ring-4 ring-blue-500/20 z-10">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-[10px] font-bold px-4 py-1.5 rounded-full text-white shadow-lg uppercase tracking-wider">
                 Most Popular
              </div>
              
              <h3 className="font-bold text-xl mb-2 text-blue-300 mt-4">Pro Team</h3>
              <div className="flex justify-center items-end gap-2 mb-2">
                 <p className="text-5xl font-extrabold">₹499</p>
                 <span className="text-slate-400 text-lg mb-1">/mo</span>
              </div>
              <p className="text-slate-400 text-sm mb-8">per active member</p>
              
              <div className="h-px bg-slate-800 mb-8 w-full"></div>
              
              <ul className="text-left space-y-4 mb-8 text-sm font-medium">
                <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400"/></div> <span><strong>Unlimited</strong> Lead Uploads</span></li>
                <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400"/></div> <span>Auto-Assignment Engine</span></li>
                <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400"/></div> <span>Manager "Spy" View</span></li>
                <li className="flex items-center gap-3"><div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400"/></div> <span>WhatsApp Click-to-Chat</span></li>
              </ul>
              <Link to="/login" className="block w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50 hover:shadow-blue-600/50">
                Get Started Now
              </Link>
              <p className="text-[10px] text-center mt-4 text-slate-500">No credit card required for trial</p>
            </div>

            {/* 3. Business (Anchor High) */}
            <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 transition-all hover:shadow-lg">
              <h3 className="font-bold text-xl mb-2 text-slate-800">Enterprise</h3>
              <div className="flex justify-center items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-slate-900">₹999</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <p className="text-slate-500 text-sm mb-8 px-4">For large teams with custom needs.</p>
              <ul className="text-left space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-blue-500"/> Custom API Access</li>
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-blue-500"/> Dedicated Account Manager</li>
                <li className="flex items-center gap-3 text-slate-600"><CheckCircle size={18} className="text-blue-500"/> White Label Domain</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:border-slate-900 hover:text-slate-900 transition-all">Contact Sales</Link>
            </div>

          </div>
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto bg-blue-600 rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Ready to automate your sales?</h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
              Join 1,000+ sales teams who save 20 hours/week with LeadFlow. 
              Setup takes less than 2 minutes.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1">
              Create Free Account <ArrowRight size={20}/>
            </Link>
            <p className="text-sm text-blue-200 mt-6 opacity-80">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 text-sm">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12">
           <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">LF</div>
                <span className="font-bold text-white text-xl">LeadFlow</span>
             </div>
             <p className="leading-relaxed mb-6 opacity-80">
               Automating sales distribution for India's fastest growing teams. Built for speed and simplicity.
             </p>
             <div className="flex gap-4">
                <SocialIcon><Users size={18}/></SocialIcon>
                <SocialIcon><Globe size={18}/></SocialIcon>
                <SocialIcon><Server size={18}/></SocialIcon>
             </div>
           </div>

           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Platform</h4>
             <ul className="space-y-3">
               <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Integrations</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Updates</a></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Company</h4>
             <ul className="space-y-3">
               <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Support</h4>
             <ul className="space-y-3">
               <li><a href="mailto:support@leadflow.app" className="hover:text-blue-400 transition-colors">support@leadflow.app</a></li>
               <li><p>Gurugram, India</p></li>
               <li className="pt-4 flex items-center gap-2 text-xs text-green-500 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> All Systems Operational
               </li>
             </ul>
           </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>© 2024 LeadFlow SaaS. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 👇 Components & Data
const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all group">
    <div className="mb-6 p-3 bg-white rounded-xl inline-block shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const SocialIcon = ({ children }: any) => (
  <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
    {children}
  </div>
);

const BoxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const testimonials = [
    {
        name: "Rahul Sharma",
        role: "Team Leader, Forever living product",
        img: "https://i.pravatar.cc/150?u=rahul",
        quote: "Before LeadFlow, we wasted 4 hours daily assigning leads manually on Excel. Now it's instant. Sales up by 40% in just 2 months!"
    },
    {
        name: "Priya Singh",
        role: "supervisor, Forever living product",
        img: "https://i.pravatar.cc/150?u=priya",
        quote: "The 'Spy View' is a game changer. I know exactly who is working and who is slacking. Highly recommended for remote teams."
    },
    {
        name: "Amit Verma",
        role: "Manager, Forever living product",
        img: "https://i.pravatar.cc/150?u=amit",
        quote: "Simple UI. My team understood it in 10 minutes. No complex training needed. Best investment for my agency."
    },
    {
        name: "Sneha Gupta",
        role: "Beginner, Forever living product",
        img: "https://i.pravatar.cc/150?u=sneha",
        quote: "Support is amazing. They helped me set up my Google Sheet in 5 minutes. The WhatsApp click-to-chat feature saves so much time."
    }
];

export default Landing;
