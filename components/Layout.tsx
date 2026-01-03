import React from 'react';
import { Sidebar } from './Sidebar';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
}

export const Layout: React.FC<LayoutProps> = ({ children, userRole }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Component */}
      <Sidebar userRole={userRole} />
      
      {/* Main Content Area */}
      {/* 
        Mobile: 
        - pt-16 = space for hamburger menu button
        - px-4 = small horizontal padding
        - pb-6 = bottom padding
        - No margin-left (sidebar is overlay)
        
        Desktop:
        - md:ml-64 = margin for fixed sidebar
        - md:pt-8 = normal top padding
        - md:px-8 = larger horizontal padding
      */}
      <main className="
        min-h-screen
        pt-16 pb-6 px-4
        md:pt-8 md:pb-8 md:px-8 md:ml-64
      ">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
