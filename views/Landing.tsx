
import React from "react";
import { AuthView } from "./Auth";
import { 
  CheckCircle2, 
  MapPin, 
  Users, 
  Calendar, 
  Table, 
  ShieldCheck, 
  ArrowRight, 
  Star,
  Zap,
  Filter,
  BarChart3
} from "lucide-react";

interface LandingProps {
  showAuth: boolean;
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ showAuth, onStart }) => {
  const scrollToAuth = () => {
    onStart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-900">
      {/* --- Navbar --- */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">LeadFlow<span className="text-brand-600">CRM</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={scrollToAuth} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              Features
            </button>
            <button onClick={scrollToAuth} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              How it Works
            </button>
            <button onClick={scrollToAuth} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              Pricing
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <button 
              onClick={scrollToAuth}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Login
            </button>
            <button 
              onClick={scrollToAuth}
              className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
            >
              Get Started
            </button>
          </div>
          {/* Mobile Login Button (Simplified) */}
          <button onClick={scrollToAuth} className="md:hidden text-sm font-bold text-brand-600">
            Login
          </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
           {/* Abstract Background Shapes */}
           <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-30" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
              <defs>
                 <linearGradient id="b" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                 </linearGradient>
              </defs>
              <g fill="url(#b)">
                 <circle cx="200" cy="200" r="200" filter="blur(80px)" opacity="0.4" />
                 <circle cx="800" cy="500" r="250" filter="blur(100px)" opacity="0.3" />
              </g>
           </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Hero Content */}
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold mb-6 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                New: Google Sheets 2-Way Sync
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
                Stop Wasting Time on <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Bad Leads</span>.
              </h1>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Automate your lead distribution. Filter by city, budget, and date. 
                Perfect for <strong>Wedding Photographers, Makeup Artists, and Event Planners</strong> who need to organize chaos.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-8">
                <button 
                  onClick={scrollToAuth}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white rounded-xl font-bold shadow-xl shadow-brand-500/30 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card needed
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-8 pt-4 border-t border-slate-200/60">
                <div>
                   <div className="flex -space-x-2">
                     {[1,2,3,4].map(i => (
                       <div key={i} className={`h-8 w-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 bg-cover`} style={{backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})`}}></div>
                     ))}
                   </div>
                   <p className="text-xs text-slate-500 mt-1 font-medium">500+ Professionals</p>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="flex flex-col">
                   <div className="flex text-amber-400">
                     {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                   </div>
                   <p className="text-xs text-slate-500 mt-1 font-medium">4.9/5 Rating</p>
                </div>
              </div>
            </div>

            {/* Hero Visual or Auth */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-full">
              {showAuth ? (
                <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 p-1 border border-slate-100 animate-in fade-in zoom-in duration-300">
                   <AuthView />
                </div>
              ) : (
                <div className="relative group perspective-1000">
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-100 to-indigo-50 rounded-2xl transform rotate-3 scale-105 opacity-70 group-hover:rotate-6 transition-transform duration-500"></div>
                  <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
                     {/* Fake UI Header */}
                     <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                        <div className="flex gap-1.5">
                           <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                           <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
                           <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
                        </div>
                        <div className="h-2 w-32 bg-slate-200 rounded-full ml-2"></div>
                     </div>
                     {/* Fake UI Body */}
                     <div className="p-6 space-y-6">
                        <div className="flex justify-between items-end">
                           <div>
                              <div className="h-2 w-20 bg-slate-200 rounded mb-2"></div>
                              <div className="h-6 w-40 bg-slate-800 rounded"></div>
                           </div>
                           <div className="h-8 w-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
                              <Filter className="h-4 w-4" />
                           </div>
                        </div>
                        
                        {/* List Items */}
                        <div className="space-y-3">
                           {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-brand-200 hover:bg-brand-50/30 transition-colors cursor-default">
                                 <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                       {String.fromCharCode(64 + i)}
                                    </div>
                                    <div>
                                       <div className="h-2 w-24 bg-slate-300 rounded mb-1.5"></div>
                                       <div className="h-1.5 w-16 bg-slate-200 rounded"></div>
                                    </div>
                                 </div>
                                 <div className="h-6 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                    SENT
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* Chart Area */}
                        <div className="pt-4 border-t border-slate-100">
                           <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-semibold text-slate-500">DISTRIBUTION STATS</span>
                           </div>
                           <div className="flex items-end gap-2 h-24">
                              {[40, 70, 50, 90, 60, 80].map((h, idx) => (
                                 <div key={idx} className="flex-1 bg-brand-100 rounded-t-sm relative group cursor-pointer">
                                    <div className="absolute bottom-0 left-0 right-0 bg-brand-500 rounded-t-sm transition-all duration-500" style={{height: `${h}%`}}></div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- Trust Logos --- */}
      <section className="py-10 border-y border-slate-200 bg-white">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Trusted by 500+ top wedding planners & studios</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Placeholders for logos */}
               <div className="h-8 w-24 bg-slate-200 rounded"></div>
               <div className="h-8 w-28 bg-slate-200 rounded"></div>
               <div className="h-8 w-20 bg-slate-200 rounded"></div>
               <div className="h-8 w-32 bg-slate-200 rounded"></div>
               <div className="h-8 w-24 bg-slate-200 rounded"></div>
            </div>
         </div>
      </section>

      {/* --- Features Section --- */}
      <section className="py-20 lg:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Everything you need to manage leads</h2>
            <p className="text-lg text-slate-600">Built specifically for high-volume service businesses. No more copy-pasting from emails to spreadsheets.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
               icon={Zap} 
               title="Auto Lead Distribution" 
               desc="Instantly route leads to your team based on availability and daily limits. Zero latency." 
            />
            <FeatureCard 
               icon={MapPin} 
               title="City-Based Filtering" 
               desc="Only get leads for events in cities you actually serve. Stop wasting time on out-of-zone queries." 
            />
            <FeatureCard 
               icon={Users} 
               title="Active-Only Routing" 
               desc="System automatically skips inactive team members or those with expired plans." 
            />
            <FeatureCard 
               icon={Calendar} 
               title="Flexible Plans" 
               desc="Daily, weekly, or monthly limits. Control your budget and lead flow with a single click." 
            />
            <FeatureCard 
               icon={Table} 
               title="Google Sheets Sync" 
               desc="Real-time 2-way sync. Leads land in your personal Google Sheet instantly." 
            />
            <FeatureCard 
               icon={ShieldCheck} 
               title="Secure Payments" 
               desc="Integrated with Razorpay for secure, automated subscription management." 
            />
          </div>
        </div>
      </section>

      {/* --- How It Works --- */}
      <section className="py-20 bg-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">Setup in less than 2 minutes</h2>
                  <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:h-full before:w-0.5 before:bg-slate-100">
                     <Step 
                        number="1" 
                        title="Create your account" 
                        desc="Sign up and link your Google account. We instantly create your personal lead sheet." 
                     />
                     <Step 
                        number="2" 
                        title="Set your filters" 
                        desc="Choose your target cities, budget range, and preferred event types." 
                     />
                     <Step 
                        number="3" 
                        title="Start getting leads" 
                        desc="Activate a plan. Leads start appearing in your dashboard and sheet immediately." 
                     />
                  </div>
                  <button onClick={scrollToAuth} className="mt-10 btn-primary">
                     Start Setup Now
                  </button>
               </div>
               <div className="hidden lg:block relative">
                  <div className="absolute inset-0 bg-brand-600 rounded-3xl rotate-3 opacity-10"></div>
                  <div className="relative bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-800">
                     <div className="flex items-center gap-2 mb-8">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                     </div>
                     <div className="space-y-4 font-mono text-sm">
                        <div className="flex gap-4 text-slate-400">
                           <span>1</span> <span className="text-purple-400">const</span> <span className="text-blue-400">user</span> = <span className="text-green-400">await</span> auth.create();
                        </div>
                        <div className="flex gap-4 text-slate-400">
                           <span>2</span> <span className="text-purple-400">await</span> sheet.sync(<span className="text-orange-300">"New Lead"</span>);
                        </div>
                        <div className="flex gap-4 text-slate-400">
                           <span>3</span> <span className="text-slate-500">// Distribution active...</span>
                        </div>
                        <div className="pl-8 pt-4">
                           <div className="p-3 bg-slate-800/50 rounded border border-slate-700 text-green-400">
                              ✓ Lead assigned to Sarah (Mumbai)<br/>
                              ✓ Sheet updated row #42
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- Testimonials --- */}
      <section className="py-20 bg-slate-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Loved by Pros</h2>
            <div className="grid md:grid-cols-3 gap-8">
               <TestimonialCard 
                  name="Sarah Jenkins" 
                  role="Wedding Photographer"
                  quote="I used to spend 2 hours a day sorting emails. Now LeadFlow sends me only the Mumbai weddings I want. Doubled my booking rate."
                  imgId="32"
               />
               <TestimonialCard 
                  name="Raj Patel" 
                  role="Makeup Artist"
                  quote="The Google Sheets sync is a lifesaver. My assistant sees the new leads instantly and calls them. Zero latency."
                  imgId="11"
               />
               <TestimonialCard 
                  name="Emily Chen" 
                  role="Event Planner"
                  quote="Simple, effective, and cheap. The daily pass is great for when I want to fill a specific weekend slot."
                  imgId="44"
               />
            </div>
         </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-20">
         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-brand-600 rounded-3xl p-8 md:p-16 text-center text-white shadow-2xl shadow-brand-600/30 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10">
                   <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full"><path d="M0 100 L100 0 L100 100 Z" fill="white" /></svg>
               </div>
               <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to scale your business?</h2>
                  <p className="text-brand-100 text-lg mb-10 max-w-2xl mx-auto">
                     Join 500+ professionals automating their lead flow today. 
                     No contracts, cancel anytime.
                  </p>
                  <button 
                     onClick={scrollToAuth}
                     className="bg-white text-brand-600 text-lg font-bold px-10 py-4 rounded-full hover:bg-brand-50 hover:scale-105 transition-all shadow-lg"
                  >
                     Start 7-Day Free Trial
                  </button>
                  <p className="mt-4 text-sm text-brand-200 opacity-80">No credit card required for sign up.</p>
               </div>
            </div>
         </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center text-white font-bold">L</div>
               <span className="text-white font-semibold">LeadFlow CRM</span>
            </div>
            <div className="flex gap-8 text-sm">
               <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
               <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <div className="text-xs">
               © {new Date().getFullYear()} LeadFlow Inc. All rights reserved.
            </div>
         </div>
      </footer>
    </div>
  );
};

// --- Helper Components ---

const FeatureCard: React.FC<{ icon: any, title: string, desc: string }> = ({ icon: Icon, title, desc }) => (
   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 group">
      <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors">
         <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
   </div>
);

const Step: React.FC<{ number: string, title: string, desc: string }> = ({ number, title, desc }) => (
   <div className="relative pl-10">
      <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm z-10">
         {number}
      </div>
      <h4 className="text-lg font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-slate-600 text-sm">{desc}</p>
   </div>
);

const TestimonialCard: React.FC<{ name: string, role: string, quote: string, imgId: string }> = ({ name, role, quote, imgId }) => (
   <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
      <div className="flex items-center gap-4 mb-6">
         <img src={`https://i.pravatar.cc/150?img=${imgId}`} alt={name} className="h-12 w-12 rounded-full object-cover" />
         <div>
            <h5 className="font-bold text-slate-900">{name}</h5>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{role}</p>
         </div>
      </div>
      <div className="flex text-amber-400 mb-3">
         {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
      </div>
      <p className="text-slate-700 italic leading-relaxed">"{quote}"</p>
   </div>
);
