import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Zap, BarChart3, Shield, ArrowRight, Smartphone, Users, Globe } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="font-sans text-slate-900">
      
      {/* ================= NAV BAR ================= */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
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
          <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
            🚀 The #1 CRM for Network Marketing & Sales Teams
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Stop Losing Leads on Excel.<br />
            <span className="text-blue-600">Automate Your Entire Team.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Distribute leads from Facebook/Google Ads directly to your team's mobile in <span className="font-bold text-slate-800">0.5 seconds</span>. Track calls, sales, and performance automatically.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-blue-700 transition-transform hover:-translate-y-1">
              Start Free Trial
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all">
              See How It Works
            </a>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-blue-600 blur-[100px] opacity-20 rounded-full"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 md:p-4 overflow-hidden">
               {/* Placeholder for Dashboard Image */}
               <div className="bg-slate-50 rounded-xl aspect-[16/9] flex items-center justify-center border border-dashed border-slate-300">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-400 font-medium">✨ Dashboard Screenshot Here ✨</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS / TRUST ================= */}
      <section className="py-10 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all">
          {['Meta Ads', 'Google Sheets', 'WhatsApp API', 'Supabase'].map((brand) => (
             <span key={brand} className="text-xl font-bold text-slate-400">{brand} Compatible</span>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Top Leaders Choose LeadFlow?</h2>
            <p className="text-slate-500 text-lg">Managing a team on WhatsApp groups and Excel sheets is a recipe for disaster. We fixed it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="text-yellow-500" />}
              title="Instant Lead Distribution"
              desc="Connect your Google Sheet. As soon as a lead arrives, it's assigned to a member instantly. No manual copy-paste."
            />
            <FeatureCard 
              icon={<Smartphone className="text-blue-500" />}
              title="Mobile-First Dashboard"
              desc="Your team gets a simple app-like dashboard. They can Call or WhatsApp leads with just one click."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-purple-500" />}
              title="Manager Spy View"
              desc="See exactly who is calling and who is sleeping. Track conversion rates per member in real-time."
            />
            <FeatureCard 
              icon={<Shield className="text-green-500" />}
              title="Data Security"
              desc="Members can only see their assigned leads. They cannot steal or download your entire database."
            />
            <FeatureCard 
              icon={<Users className="text-orange-500" />}
              title="Team Leaderboard"
              desc="Gamify your sales. Show who is the top performer and create healthy competition in your team."
            />
            <FeatureCard 
              icon={<Globe className="text-indigo-500" />}
              title="Works Everywhere"
              desc="Compatible with Facebook Leads, Website Forms, or any source that can send data to Google Sheets."
            />
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">3 Simple Steps to Automation</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-center relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-slate-200 -z-10"></div>
            <StepCard number="1" title="Create Team Code" desc="Sign up as a Manager and get a unique Team Code." />
            <StepCard number="2" title="Connect Sheets" desc="Paste our Script into your Google Sheet to sync leads." />
            <StepCard number="3" title="Add Members" desc="Your team joins using the code and starts getting leads." />
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-500 mb-12">Stop paying for expensive CRMs. Pay per member.</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 border border-slate-200 rounded-2xl hover:border-slate-300 transition-all">
              <h3 className="font-bold text-xl mb-2">Starter</h3>
              <p className="text-4xl font-extrabold mb-2">₹0</p>
              <p className="text-slate-400 text-sm mb-6">For trying out</p>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> 1 Manager</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> 5 Leads / Day</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Basic Dashboard</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Try Free</Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-xl transform md:-translate-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
              <h3 className="font-bold text-xl mb-2">Pro Member</h3>
              <p className="text-4xl font-extrabold mb-2">₹499<span className="text-lg font-normal text-slate-400">/mo</span></p>
              <p className="text-slate-400 text-sm mb-6">For serious closers</p>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-blue-400"/> Unlimited Leads</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-blue-400"/> Priority Support</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-blue-400"/> WhatsApp Click-to-Chat</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-blue-400"/> Performance Badge</li>
              </ul>
              <Link to="/login" className="block w-full py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-700">Get Started</Link>
            </div>

            {/* Team Plan */}
            <div className="p-8 border border-slate-200 rounded-2xl hover:border-slate-300 transition-all">
              <h3 className="font-bold text-xl mb-2">Team Leader</h3>
              <p className="text-4xl font-extrabold mb-2">₹999<span className="text-lg font-normal text-slate-400">/mo</span></p>
              <p className="text-slate-400 text-sm mb-6">For big teams</p>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Manage 50+ Members</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Advanced Analytics</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Bulk Upload</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Admin Controls</li>
              </ul>
              <Link to="/login" className="block w-full py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA FOOTER ================= */}
      <section className="py-20 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to 10x Your Team's Sales?</h2>
          <p className="text-blue-100 mb-10 text-lg">Join 100+ managers who switched from Excel to LeadFlow today.</p>
          <Link to="/login" className="px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-xl shadow-lg hover:bg-blue-50 transition-all">
            Create Free Account
          </Link>
          <p className="mt-6 text-sm text-blue-200 opacity-80">No credit card required for trial.</p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
             <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">LF</div>
                <span className="font-bold text-white text-lg">LeadFlow</span>
             </div>
             <p className="text-sm">© 2024 LeadFlow SaaS. All rights reserved.</p>
           </div>
           <div className="flex gap-6 text-sm">
             <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-white transition-colors">Support</a>
           </div>
        </div>
      </footer>

    </div>
  );
};

// Sub-components
const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all group">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const StepCard = ({ number, title, desc }: { number: string, title: string, desc: string }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative z-10">
    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg shadow-blue-200">
      {number}
    </div>
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <p className="text-slate-500">{desc}</p>
  </div>
);
