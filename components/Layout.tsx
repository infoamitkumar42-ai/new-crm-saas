import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Target Audience', path: '/target' },
    { icon: CreditCard, label: 'Plans & Billing', path: '/subscription' },
  ];

  // 🎨 SOLID COLORS (Hardcoded to bypass Tailwind issues)
  const DARK_BG = '#0f172a'; // Deep Navy Blue
  const BRAND_COLOR = '#4f46e5'; // Indigo/Blue
  const WHITE = '#ffffff';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }} className="lg:flex-row">
      
      {/* 📱 MOBILE TOP BAR (Forced Solid Background) */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-4 shadow-md"
        style={{ backgroundColor: DARK_BG, borderBottom: '1px solid #1e293b' }}
      >
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: BRAND_COLOR }} className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white">L</div>
          <span style={{ color: WHITE }} className="font-bold text-lg tracking-wide">LeadFlow</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          style={{ color: WHITE }}
          className="p-2"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* 📱 MOBILE MENU FULL SCREEN OVERLAY (Forced Solid) */}
      {isMobileMenuOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: DARK_BG, 
            zIndex: 90,
            paddingTop: '80px', // Space for top bar
            display: 'flex',
            flexDirection: 'column'
          }}
          className="lg:hidden"
        >
            {/* Menu Items */}
            <nav className="flex-1 px-4 space-y-4">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setIsMobileMenuOpen(false);
                            }}
                            style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                padding: '16px', 
                                borderRadius: '12px',
                                backgroundColor: isActive ? BRAND_COLOR : 'transparent',
                                color: WHITE,
                                fontWeight: isActive ? 'bold' : 'normal',
                                opacity: isActive ? 1 : 0.8
                            }}
                        >
                            <item.icon size={24} />
                            <span style={{ fontSize: '18px' }}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div style={{ padding: '20px', borderTop: '1px solid #1e293b' }}>
                <button 
                    onClick={handleLogout}
                    style={{ 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        padding: '16px', 
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        fontWeight: 'bold'
                    }}
                >
                    <LogOut size={24} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
      )}

      {/* 🖥️ DESKTOP SIDEBAR (Unaffected, keeping it solid) */}
      <aside 
        className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 overflow-y-auto"
        style={{ backgroundColor: DARK_BG, color: WHITE }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div style={{ backgroundColor: BRAND_COLOR }} className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xl">L</div>
            <span className="text-2xl font-bold tracking-tight">LeadFlow</span>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium`}
                  style={{ 
                    backgroundColor: isActive ? BRAND_COLOR : 'transparent',
                    color: isActive ? WHITE : '#94a3b8'
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6" style={{ borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 📄 MAIN CONTENT WRAPPER */}
      <main className="flex-1 w-full min-h-screen pt-20 lg:pt-0 lg:ml-72" style={{ backgroundColor: '#f8fafc' }}>
         <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
         </div>
      </main>
    </div>
  );
};
