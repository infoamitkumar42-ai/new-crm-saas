import React from 'react';
import { Sidebar } from './Sidebar';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole; // ✅ Role accept karega
}

export const Layout: React.FC<LayoutProps> = ({ children, userRole }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar ko Role pass kiya */}
      <Sidebar userRole={userRole} />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
