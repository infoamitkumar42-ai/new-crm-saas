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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      
      {/* 📱 MOBILE TOP BAR (Solid Dark Blue - No Blur) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">L</div>
          <span className="font-bold text-lg tracking-wide">LeadFlow</span>
        </div>
        {/* Hamburger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-slate-300 hover:text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* 📱 MOBILE MENU OVERLAY (Click outside to close) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* 📂 SIDEBAR (Solid Background for Mobile & Desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-auto lg:shadow-none
      `}>
        <div className="h-full flex flex-col">
            {/* Sidebar Header (Visible mainly on Desktop) */}
            <div className="hidden lg:flex items-center gap-3 p-6 mb-2">
                <div className="h-10 w-10 bg-brand-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">L</div>
                <span className="text-2xl font-bold tracking-tight">LeadFlow</span>
            </div>

            {/* Mobile Header inside Menu (To show brand when menu is open) */}
            <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
                <span className="text-xl font-bold text-white">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto bg-slate-900">
                {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                    key={item.path}
                    onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-200 font-medium text-left
                        ${isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="text-base">{item.label}</span>
                    </button>
                );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-4 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
      </aside>

      {/* 📄 MAIN CONTENT AREA */}
      <main className="flex-1 w-full bg-slate-50 min-h-screen pt-20 lg:pt-0">
         <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
         </div>
      </main>
    </div>
  );
};
