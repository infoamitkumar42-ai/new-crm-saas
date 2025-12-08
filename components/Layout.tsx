import React from 'react';
import { LayoutDashboard, Filter, CreditCard, Settings, ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate?: (tab: string) => void;
  // Support both naming conventions for compatibility
  onTabChange?: (tab: string) => void;
  user: User;
  onLogout: () => void;
  showAdminTab?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onNavigate, 
  onTabChange, 
  user, 
  onLogout,
  showAdminTab = false 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Helper to handle tab change from either prop
  const handleNavigation = (tab: string) => {
    if (onNavigate) onNavigate(tab);
    if (onTabChange) onTabChange(tab);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'filters', label: 'Lead Filters', icon: Filter },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (showAdminTab) {
    navItems.push({ id: 'admin', label: 'Master Admin', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold text-white tracking-tight">LeadFlow</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate w-32">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-20 flex items-center justify-between px-4 h-16">
        <span className="font-bold text-lg">LeadFlow</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-0 pt-16 md:pt-0 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-10 bg-slate-900 pt-16 md:hidden">
           <nav className="px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleNavigation(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-3 text-base font-medium rounded-lg ${
                  activeTab === item.id ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
            <button 
              onClick={onLogout}
              className="w-full flex items-center px-3 py-3 text-base font-medium text-red-400 hover:bg-slate-800 rounded-lg mt-4"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};
