import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, Menu, X, Network } from 'lucide-react'; // Network icon added
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
    { icon: Network, label: 'Team Manager', path: '/team' }, // 👈 NEW ITEM ADDED
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      
      {/* 📱 MOBILE TOP BAR (Solid Dark Blue) */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow-md"
        style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' }}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#2563eb' }}>L</div>
          <span className="font-bold text-lg text-white">LeadFlow</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="text-white p-1 focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* 📱 MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                zIndex: 40, backgroundColor: 'rgba(0, 0, 0, 0.7)' 
            }}
            onClick={() => setIsMobileMenuOpen(false)}
        >
            <div 
                style={{ 
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', maxWidth: '300px',
                    backgroundColor: '#0f172a', paddingTop: '80px', display: 'flex', flexDirection: 'column',
                    boxShadow: '4px 0 15px rgba(0,0,0,0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-white"
                                style={{
                                    backgroundColor: isActive ? '#2563eb' : 'transparent',
                                    border: isActive ? 'none' : '1px solid #334155'
                                }}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="p-6 border-t border-slate-800 pb-10">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 bg-red-900/10 font-bold"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 🖥️ DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 bg-slate-900 text-white overflow-y-auto z-40">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">L</div>
            <span className="text-2xl font-bold">LeadFlow</span>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-medium transition-colors ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <item.icon size={20} /> <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400"><LogOut size={20} /> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 w-full pt-20 lg:pt-0 lg:ml-72 bg-slate-50 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"><Outlet /></div>
      </main>
    </div>
  );
};
