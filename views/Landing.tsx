import React from "react";
// 👇 FIX: Yahan 'Auth' import kiya hai (Pehle AuthView tha)
import { Auth } from "./Auth"; 
import { CheckCircle2, ArrowRight, Zap, Star, Filter } from "lucide-react";

interface LandingProps {
  showAuth?: boolean;
  onStart?: () => void;
}

export const Landing: React.FC<LandingProps> = ({ showAuth = false, onStart = () => {} }) => {
  const scrollToAuth = () => {
    onStart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900">LeadFlow</span>
          <button onClick={scrollToAuth} className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold">Get Started</button>
        </div>
      </nav>

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-extrabold mb-6">Automate Your Lead Flow</h1>
            <p className="text-xl text-slate-600 mb-8">Stop wasting time on bad leads. Filter, Distribute, and Convert faster.</p>
            <button onClick={scrollToAuth} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2">
              Start Free Trial <ArrowRight />
            </button>
          </div>
          <div>
            {/* 👇 FIX: Yahan 'Auth' component use kiya hai */}
            <div className="bg-white p-2 rounded-2xl shadow-2xl border">
               <Auth />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
