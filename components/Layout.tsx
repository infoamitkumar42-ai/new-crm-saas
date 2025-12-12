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

  // 🎨 SOLID COLORS (Hardcoded Variables)
  const SOLID_BG = '#0f172a'; // Dark Slate Blue (Solid)
  const ACTIVE_BG = '#4f46e5'; // Brand Blue
  const TEXT_WHITE = '#ffffff';
  const TEXT_GRAY = '#cbd5e1';

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      
      {/* ==============================================
          MOBILE TOP HEADER (Always Visible on Mobile)
          z-index: 50 ensures it stays above content
      =============================================== */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow-md"
        style={{ backgroundColor: SOLID_BG, borderBottom: '1px solid #334155' }}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded flex items-center justify-center font-bold text-white" style={{ backgroundColor: ACTIVE_BG }}>L</div>
          <span className="font-bold text-lg text-white">LeadFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-1">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* ==============================================
          MOBILE FULL SCREEN MENU (The Fix)
          z-index: 9999 ensures NOTHING can be above it.
          No Blur. Solid Color.
      =============================================== */}
      {isMobileMenuOpen && (
        <div 
          style={{ 
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: SOLID_BG, // 👈 FORCE SOLID COLOR
            zIndex: 9999, // 👈 FORCE TOP LAYER
            paddingTop: '70px', // Space for top bar
            display: 'flex',
            flexDirection: 'column'
          }}
          className="lg:hidden"
        >
          <div className="flex-1 px-6 space-y-4 overflow-y-auto">
             {/* Navigation Items */}
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
                      gap: '15px',
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                      color: isActive ? TEXT_WHITE : TEXT_GRAY,
                      fontWeight: 'bold',
                      fontSize: '18px',
                      border: isActive ? 'none' : '1px solid #334155'
                    }}
                  >
                    <item.icon size={24} color={isActive ? TEXT_WHITE : TEXT_GRAY} />
                    <span>{item.label}</span>
                  </button>
                );
             })}
          </div>

          {/* Logout at Bottom */}
          <div className="p-6 border-t border-slate-700 bg-slate-900 pb-10">
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                fontWeight: 'bold',
                fontSize: '18px'
              }}
            >
              <LogOut size={24} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ==============================================
          DESKTOP SIDEBAR (Normal)
      =============================================== */}
      <aside className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 bg-slate-900 text-white overflow-y-auto z-40">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-brand-600 rounded-xl flex items-center justify-center font-bold text-xl">L</div>
            <span className="text-2xl font-bold">LeadFlow</span>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-medium transition-colors
                    ${isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ==============================================
          MAIN CONTENT
      =============================================== */}
      <main className="flex-1 w-full pt-20 lg:pt-0 lg:ml-72 bg-slate-50 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
