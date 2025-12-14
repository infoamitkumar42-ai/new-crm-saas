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

      {/* ================= HERO SECTION ================= */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-blue-200">
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

          {/* Browser Mockup Frame */}
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-blue-600 blur-[120px] opacity-20 rounded-full"></div>
            <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 overflow-hidden ring-1 ring-slate-900/10">
               <div className="h-8 bg-slate-800 rounded-t-xl flex items-center px-4 gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 px-3 py-1 bg-slate-700 rounded-md text-[10px] text-slate-400 font-mono">leadflow.app/dashboard</div>
               </div>
               {/* Dashboard Placeholder */}
               <div className="bg-white rounded-b-xl aspect-[16/9] flex items-center justify-center border-t border-slate-700 relative overflow-hidden group">
                  <div className="text-center z-10">
                    <BarChart3 size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold text-lg">Your Dashboard Screenshot Goes Here</p>
                  </div>
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
                <span className="text-lg font-bold text-slate-600 flex items-center gap-2"><Lock size={18}/> Enterprise Security</span>
                <span className="text-lg font-bold text-slate-600 flex items-center gap-2"><Server size={18}/> 99.9% Uptime</span>
                <span className="text-lg font-bold text-slate-600 flex items-center gap-2"><Shield size={18}/> GDPR Ready</span>
            </div>
         </div>
      </section>

      {/* ================= TESTIMONIALS (Updated) ================= */}
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
                quote="Simple UI. My team understood it in 10 minutes. No complex training needed. Best investment for my agency."
                name="Amit Verma"
                role="Founder, Digital Ads"
                stars={4}
            />
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Pricing Plans</h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
            Transparent pricing. No hidden fees. Cancel anytime.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            
            {/* 1. Trial */}
            <div className="p-8 bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition-all">
              <h3 className="font-bold text-xl mb-2 text-slate-800">Trial</h3>
              <p className="text-4xl font-extrabold mb-2">₹0</p>
              <p className="text-slate-400 text-sm mb-6">Forever Free</p>
              <div className="border-t border-slate-100 my-6"></div>
              <ul className="text-left space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-slate-400"/> 1 Manager</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-slate-400"/> 5 Leads / Day</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-slate-400"/> Basic Support</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-blue-200 text-blue-600 rounded-xl font-bold hover:bg-blue-50">Try Now</Link>
            </div>

            {/* 2. Pro (Best Value) */}
            <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-2xl scale-105 relative border border-slate-700">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-bold px-3 py-1 rounded-bl-xl text-white shadow-lg">
                 MOST POPULAR
              </div>
              <h3 className="font-bold text-xl mb-2 text-blue-400">Pro Manager</h3>
              
              <div className="flex justify-center items-end gap-2 mb-2">
                 <p className="text-4xl font-extrabold">₹499</p>
                 <span className="text-slate-400 text-lg line-through mb-1">₹1999</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">/month per member</p>
              
              <div className="border-t border-slate-700 my-6"></div>
              <ul className="text-left space-y-4 mb-8 text-sm font-medium">
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-400"/> <span><strong>Unlimited</strong> Leads</span></li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-400"/> <span>Real-time Sync</span></li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-400"/> <span>WhatsApp Click-to-Chat</span></li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-400"/> <span>Priority Support</span></li>
              </ul>
              <Link to="/login" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-bold hover:to-blue-600 shadow-lg shadow-blue-900/50">
                Get Started
              </Link>
              <p className="text-xs text-center mt-3 text-slate-500">30-Day Money Back Guarantee</p>
            </div>

            {/* 3. Business */}
            <div className="p-8 bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition-all">
              <h3 className="font-bold text-xl mb-2 text-slate-800">Business</h3>
              <p className="text-4xl font-extrabold mb-2">₹999</p>
              <p className="text-slate-400 text-sm mb-6">/month per member</p>
              <div className="border-t border-slate-100 my-6"></div>
              <ul className="text-left space-y-4 mb-8 text-sm">
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-blue-600"/> Everything in Pro</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-blue-600"/> Advanced API Access</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-blue-600"/> Custom SLA</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-blue-600"/> Dedicated Manager</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Contact Sales</Link>
            </div>

          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-20 bg-blue-600 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Stop Working Hard. Start Working Smart.</h2>
          <p className="text-blue-100 mb-10 text-lg">Your competitors are already automating. Don't get left behind.</p>
          <Link to="/login" className="inline-block px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-xl shadow-xl hover:bg-blue-50 transition-all transform hover:scale-105">
            Create Free Account
          </Link>
          <div className="mt-8 flex justify-center gap-6 text-sm text-blue-200">
             <span className="flex items-center gap-1"><Shield size={14}/> SSL Secure</span>
             <span className="flex items-center gap-1"><CheckCircle size={14}/> Cancel Anytime</span>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12">
           
           {/* Brand */}
           <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">LF</div>
                <span className="font-bold text-white text-xl">LeadFlow</span>
             </div>
             <p className="leading-relaxed mb-4">
               The ultimate CRM for network marketing and high-volume sales teams. Automate distribution, track results.
             </p>
           </div>

           {/* Quick Links */}
           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Product</h4>
             <ul className="space-y-3">
               <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
               <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">API Docs</a></li>
             </ul>
           </div>

           {/* Legal */}
           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Legal & Security</h4>
             <ul className="space-y-3">
               <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Refund Policy</a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2">SLA & Uptime <span className="text-[10px] bg-green-900 text-green-400 px-1.5 py-0.5 rounded">99.9%</span></a></li>
               <li><a href="#" className="hover:text-blue-400 transition-colors">Data Processing (DPA)</a></li>
             </ul>
           </div>

           {/* Contact */}
           <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Contact</h4>
             <ul className="space-y-3">
               <li><a href="mailto:support@leadflow.app" className="hover:text-blue-400 transition-colors">support@leadflow.app</a></li>
               <li><p>Panipat, Haryana, India</p></li>
               <li className="pt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Lock size={12}/> PCI DSS Compliant
               </li>
             </ul>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
           © 2024 LeadFlow SaaS. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// Sub-components (Defined at the end to keep file clean)
const TestimonialCard = ({ quote, name, role, stars }: { quote: string, name: string, role: string, stars: number }) => (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
        <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < stars ? "text-yellow-400 fill-yellow-400" : "text-slate-300"} />
            ))}
        </div>
        <p className="text-slate-700 italic mb-6">"{quote}"</p>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                {name[0]}
            </div>
            <div>
                <h4 className="font-bold text-sm text-slate-900">{name}</h4>
                <p className="text-xs text-slate-500">{role}</p>
            </div>
        </div>
    </div>
);
