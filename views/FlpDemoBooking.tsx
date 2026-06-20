import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MessageCircle, 
  Zap, 
  Users, 
  BarChart3, 
  Shield, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Smartphone,
  Eye
} from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/916283182767?text=Hi,%20main%20FLP%20team%20Manager%20hoon.%20LeadFlow%20ke%20baare%20mein%20batao.';

const SLIDES = [
  '/images/slide1.webp',
  '/images/slide2.webp',
  '/images/slide3.webp',
  '/images/slide4.webp',
  '/images/slide5.webp',
  '/images/slide6.webp',
  '/images/slide7.webp',
  '/images/slide8.webp'
];

const SLIDE_CAPTIONS = [
  'Daily Fresh Leads For Your Team',
  'Real-Time Lead Alerts & Notifications',
  'Track Every Lead In One Place',
  'Monitor Daily Goals In Real-Time',
  'Manager Dashboard - Control Your Team',
  'Success Stories - Trusted By Forever Leaders',
  'Overall Performance - Scale Without Chaos',
  'Auto Lead Distribution - Fair. Smart. Instant.'
];

export const FlpDemoBooking: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Autoplay Logic
  useEffect(() => {
    if (isAutoplay) {
      autoplayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
      }, 3500);
    }
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isAutoplay]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAutoplay(false); // Pause autoplay on manual interaction
    setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAutoplay(false); // Pause autoplay on manual interaction
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const handleDotClick = (index: number) => {
    setIsAutoplay(false); // Pause autoplay on manual interaction
    setCurrentSlide(index);
  };

  return (
    <>
      <Helmet>
        {/* 🚫 Block search engines to maintain internal obscurity */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>FLP Lead Distribution System — Free Demo</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Custom Styles for Mobile-First Optimizations */}
      <style dangerouslySetInnerHTML={{__html: `
        .font-jakarta {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-green-pulse {
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
          animation: pulse-btn 2s infinite;
        }
        @keyframes pulse-btn {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); }
          50% { transform: scale(1.02); box-shadow: 0 6px 25px rgba(16, 185, 129, 0.6); }
        }
      `}} />

      <div className="font-jakarta min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center selection:bg-indigo-500 selection:text-white pb-32">
        
        {/* ── Outer Wrapper Centered for Desktop, Natural Mobile ── */}
        <div className="w-full max-w-md bg-white min-h-screen shadow-xl shadow-slate-200/50 border-x border-slate-100 flex flex-col justify-between relative">
          
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.webp" 
                alt="LeadFlow CRM Logo" 
                className="w-10 h-10 object-contain rounded-xl shadow-md border border-slate-100"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-slate-950">
                  LeadFlow<span className="text-indigo-600">CRM</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Team Rotator</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Internal Only</span>
            </div>
          </header>

          {/* Main Hero & Content Area */}
          <main className="px-5 py-6 flex-1 flex flex-col space-y-6">
            
            {/* Top Tagline */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/60">
                <Sparkles size={14} className="text-indigo-600" />
                <span className="text-[10px] font-extrabold text-indigo-700 tracking-wider uppercase">
                  For FLP Team Managers
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3 text-center flex flex-col items-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 leading-tight">
                FLP Managers ke liye
                <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500">
                  Automatic Lead Distribution System
                </span>
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                Apne Facebook Ads leads ko bina kisi manual kaam ke, automatic, fair rotation ke saath instantly poori team mein distribute karein.
              </p>
            </div>

            {/* ── App Store Slideshow Mockup Preview ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={16} className="text-slate-800" />
                  <span className="text-xs font-extrabold text-slate-800 tracking-wide">App Store Preview</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  <Eye size={12} className="animate-pulse" />
                  <span>Interactive Slider</span>
                </div>
              </div>

              {/* Slider Component */}
              <div className="relative bg-slate-50 border border-slate-100 rounded-[32px] p-4 shadow-sm">
                
                {/* Carousel Viewport */}
                <div className="relative overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-sm aspect-[473/1024] w-full max-w-[280px] mx-auto">
                  <div 
                    className="absolute inset-0 flex transition-transform duration-500 ease-out" 
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {SLIDES.map((slide, idx) => (
                      <div key={idx} className="w-full h-full flex-shrink-0">
                        <img 
                          src={slide} 
                          alt={SLIDE_CAPTIONS[idx]} 
                          className="w-full h-full object-cover select-none pointer-events-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Left Navigation Arrow */}
                  <button 
                    onClick={handlePrev} 
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-slate-100 flex items-center justify-center text-slate-700 shadow-md hover:bg-white active:scale-90 transition-all z-10"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Right Navigation Arrow */}
                  <button 
                    onClick={handleNext} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-slate-100 flex items-center justify-center text-slate-700 shadow-md hover:bg-white active:scale-90 transition-all z-10"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Active Caption */}
                <div className="text-center mt-3.5 px-2 min-h-[40px] flex items-center justify-center">
                  <p className="text-xs font-bold text-slate-700 leading-snug">
                    {SLIDE_CAPTIONS[currentSlide]}
                  </p>
                </div>

                {/* Dot Indicators */}
                <div className="flex justify-center gap-1.5 mt-2">
                  {SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDotClick(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentSlide === idx ? 'w-5 bg-indigo-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

              </div>
            </div>

            {/* Feature Bullet Points (Compact Mobile Layout) */}
            <div className="space-y-3 pt-2">
              {[
                {
                  icon: Zap,
                  title: 'Real-time Lead Assign',
                  desc: 'Meta ads se custom integration ke saath instant routing.',
                  color: 'text-indigo-600 bg-indigo-50'
                },
                {
                  icon: Users,
                  title: 'Fair Round Robin System',
                  desc: 'Kisi team member ke saath partiality nahi, equal share split.',
                  color: 'text-violet-600 bg-violet-50'
                },
                {
                  icon: BarChart3,
                  title: 'Manager Control Panel',
                  desc: 'Active/Inactive controls aur live lead status updates.',
                  color: 'text-purple-600 bg-purple-50'
                },
                {
                  icon: Shield,
                  title: '100% Secure & Verified',
                  desc: 'No duplicate lead sharing, client security complete priority.',
                  color: 'text-emerald-600 bg-emerald-50'
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/40 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <item.icon size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-sm text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </main>

          {/* Footer inside the card */}
          <footer className="px-5 py-6 bg-slate-50 border-t border-slate-100 text-center space-y-4">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              🔒 FLP INTERNAL CRM PLATFORM
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Authorized personnel only. Data encrypted via SSL.
            </p>
            <div className="pt-2.5 border-t border-slate-200/60 text-[8px] text-slate-400/80 leading-relaxed text-left space-y-1.5">
              <p>
                <strong>Disclaimer:</strong> This website is not affiliated with, endorsed by, or associated with Meta Platforms, Inc., Facebook, or Google LLC in any manner. FACEBOOK is a trademark of Meta Platforms, Inc.
              </p>
              <p>
                We strictly adhere to all advertising guidelines and policies set by Meta and Google. LeadFlow CRM provides lead distribution software utilities for sales teams; results and performance metrics may vary based on campaign setup and team activity.
              </p>
            </div>
          </footer>

          {/* Sticky Bottom CTA Bar (Highly Converting for Mobile) */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 flex justify-center shadow-2xl">
            <div className="w-full max-w-md space-y-2">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-green-pulse flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-[15px] transition-all transform active:scale-95 text-center"
              >
                <svg className="w-6 h-6 fill-white flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.075-1.33a9.923 9.923 0 0 0 4.937 1.314c5.507 0 9.991-4.479 9.992-9.985A9.998 9.998 0 0 0 12.012 2zm5.457 14.185c-.244.686-1.413 1.311-1.977 1.396-.505.076-1.144.108-1.846-.116-.426-.135-.973-.316-1.674-.619-2.946-1.272-4.869-4.24-5.015-4.437-.146-.195-1.198-1.593-1.198-3.037 0-1.444.75-2.152.99-2.446.244-.294.488-.368.651-.368.162 0 .325.002.467.01.146.007.325-.054.512.395.187.45.651 1.583.71 1.704.059.121.098.262.018.423-.079.162-.119.262-.239.403-.12.141-.252.314-.359.421-.121.121-.247.253-.105.494.141.242.629 1.037 1.349 1.678.929.827 1.71 1.082 1.954 1.203.244.121.385.101.527-.062.141-.162.61-1.077.772-1.33.162-.253.325-.212.548-.13.224.081 1.423.67 1.667.792.244.121.407.182.467.283.06.101.06.586-.184 1.272z" />
                </svg>
                <span>Free Demo Book Karo — WhatsApp Pe Aao</span>
              </a>
              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>🟢 Auto-Setup Support</span>
                <span>•</span>
                <span>⚡ Instant Consultation</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default FlpDemoBooking;
