import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, IndianRupee, Menu, X, Zap } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

interface SidebarProps {
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const linkClass = (path: string) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
      isActive(path) 
        ? 'bg-blue-50 text-blue-600 shadow-sm' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`;

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
              <Zap size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">LeadFlow</h1>
              <p className="text-[10px] text-slate-400 font-medium">CRM Dashboard</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 mt-2">
          Main Menu
        </p>
        
        <Link to="/" className={linkClass('/')} onClick={handleLinkClick}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        <Link to="/target" className={linkClass('/target')} onClick={handleLinkClick}>
          <Users size={20} />
          <span>Target Audience</span>
        </Link>

        <Link to="/subscription" className={linkClass('/subscription')} onClick={handleLinkClick}>
          <CreditCard size={20} />
          <span>My Plan</span>
        </Link>

        {/* Admin Links */}
        {userRole === 'admin' && (
          <>
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6">
              Admin Zone
            </p>
            <Link to="/admin/revenue" className={linkClass('/admin/revenue')} onClick={handleLinkClick}>
              <IndianRupee size={20} />
              <span>Revenue</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-100">
        {/* User Info (Optional) */}
        <div className="mb-3 px-4 py-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">Logged in as</p>
          <p className="text-sm font-semibold text-slate-700 truncate">
            {userRole === 'admin' ? 'Admin' : 'Member'}
          </p>
        </div>
        
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed Position */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={22} className="text-slate-700" />
      </button>

      {/* Desktop Sidebar - Hidden on Mobile */}
      <div className="hidden md:flex h-screen bg-white border-r border-slate-200 flex-col w-64 fixed left-0 top-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar - Overlay */}
      <div className={`
        md:hidden fixed inset-0 z-50 transition-all duration-300
        ${mobileOpen ? 'visible' : 'invisible pointer-events-none'}
      `}>
        {/* Dark Overlay */}
        <div 
          onClick={() => setMobileOpen(false)}
          className={`
            absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300
            ${mobileOpen ? 'opacity-100' : 'opacity-0'}
          `}
        />
        
        {/* Sidebar Panel */}
        <div className={`
          absolute left-0 top-0 h-full bg-white w-[280px] max-w-[85vw] shadow-2xl
          transition-transform duration-300 ease-out transform
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {sidebarContent}
        </div>
      </div>
    </>
  );
};
