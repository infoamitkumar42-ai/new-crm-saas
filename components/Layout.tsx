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
        - Mobile: No margin, full width with top padding for hamburger
        - Desktop: ml-64 for sidebar space
      */}
      <div className="
        min-h-screen
        pt-16 pb-6 px-4
        md:pt-8 md:pb-8 md:px-8 md:ml-64
        overflow-y-auto
      ">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
