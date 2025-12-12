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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      
      {/* 📱 MOBILE TOP BAR (Solid Dark Blue - Forced) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-[#0f172a] text-white px-4 py-4 flex items-center justify-between shadow-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white">L</div>
          <span className="font-bold text-lg tracking-wide text-white">LeadFlow</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-white hover:bg-slate-800 rounded-md"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* 📱 MOBILE MENU FULL SCREEN (Solid Background) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-[#0f172a] lg:hidden flex flex-col pt-20">
            {/* Menu Items */}
            <nav className="flex-1 px-4 py-4 space-y-3">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-lg font-bold transition-all
                                ${isActive 
                                ? 'bg-brand-600 text-white shadow-lg' 
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Logout Button (Bottom) */}
            <div className="p-6 border-t border-slate-800 bg-[#0f172a] pb-10">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-red-400 bg-red-900/10 hover:bg-red-900/20 font-bold"
                >
                    <LogOut className="w-6 h-6" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
      )}

      {/* 🖥️ DESKTOP SIDEBAR (Hidden on Mobile) */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0f172a] text-white h-screen fixed left-0 top-0 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-brand-600 rounded-xl flex items-center justify-center font-bold text-xl">L</div>
            <span className="text-2xl font-bold tracking-tight">LeadFlow</span>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                    isActive 
                      ? 'bg-brand-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 📄 MAIN CONTENT */}
      <main className="flex-1 w-full bg-[#f8fafc] min-h-screen pt-20 lg:pt-0 lg:ml-72">
         <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
         </div>
      </main>
    </div>
  );
};
