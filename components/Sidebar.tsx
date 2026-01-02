import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, IndianRupee } from 'lucide-react'; // IndianRupee icon added
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

// ✅ Props interface add kiya
interface SidebarProps {
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  const linkClass = (path: string) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
      isActive(path) 
        ? 'bg-blue-50 text-blue-600 shadow-sm' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <div className="h-full bg-white border-r border-slate-200 flex flex-col w-64 fixed left-0 top-0 overflow-hidden">
      {/* Logo Area */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <h1 className="text-xl font-bold text-slate-800">LeadFlow</h1>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        
        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
        
        <Link to="/" className={linkClass('/')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        {/* Common Links */}
        <Link to="/target" className={linkClass('/target')}>
          <Users size={20} />
          <span>Target Audience</span>
        </Link>

        <Link to="/subscription" className={linkClass('/subscription')}>
          <CreditCard size={20} />
          <span>My Plan</span>
        </Link>

        {/* ✅ ADMIN ONLY LINKS */}
        {userRole === 'admin' && (
          <>
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Admin Zone</p>
            <Link to="/admin/revenue" className={linkClass('/admin/revenue')}>
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
    </div>
  );
};
