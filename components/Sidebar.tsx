import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, IndianRupee, Menu, X } from 'lucide-react';
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
    // Close mobile menu on link click
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo Area */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <h1 className="text-xl font-bold text-slate-800">LeadFlow</h1>
          </div>
          {/* Mobile close button */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
        
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
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Admin Zone</p>
            <Link to="/admin/revenue" className={linkClass('/admin/revenue')} onClick={handleLinkClick}>
              <IndianRupee size={20} />
              <span>Revenue</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-slate-200"
      >
        <Menu size={24} />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full bg-white border-r border-slate-200 flex-col w-64 fixed left-0 top-0 overflow-hidden">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div className={`
        md:hidden fixed inset-0 z-50 transition-all duration-300
        ${mobileOpen ? 'visible' : 'invisible'}
      `}>
        {/* Overlay */}
        <div 
          onClick={() => setMobileOpen(false)}
          className={`
            absolute inset-0 bg-black transition-opacity duration-300
            ${mobileOpen ? 'opacity-50' : 'opacity-0'}
          `}
        />
        
        {/* Sidebar */}
        <div className={`
          absolute left-0 top-0 h-full bg-white w-72 shadow-xl
          transition-transform duration-300 transform
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {sidebarContent}
        </div>
      </div>
    </>
  );
};
