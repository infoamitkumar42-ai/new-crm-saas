import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../auth/useAuth';
import { Menu, X } from 'lucide-react'; // 👈 Menu aur Close icon import kiya

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* ---------------- DESKTOP SIDEBAR (Hidden on Mobile) ---------------- */}
      <div className="hidden md:block w-64 fixed h-full z-20 shadow-xl">
        <Sidebar />
      </div>

      {/* ---------------- MOBILE SIDEBAR (Slide-Over) ---------------- */}
      {/* 1. Dark Overlay (Backdrop) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)} // Bahar click krne par band ho jaye
        ></div>
      )}

      {/* 2. The Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
         {/* Close Button inside Sidebar */}
         <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-red-500"
         >
            <X size={20} />
         </button>
         
         {/* Sidebar Component ko yahan render kiya */}
         <div onClick={() => setIsMobileMenuOpen(false)}> 
            {/* Link click krne par menu band ho jayega */}
            <Sidebar />
         </div>
      </div>


      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        {/* 👇 MOBILE HEADER (Ye ab Mobile pe dikhega) */}
        <div className="md:hidden bg-white px-4 py-3 shadow-sm flex justify-between items-center sticky top-0 z-10 border-b border-slate-100">
            {/* Logo Text */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">LF</div>
                <span className="font-bold text-slate-800 text-lg">LeadFlow</span>
            </div>

            {/* Hamburger Button ☰ */}
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg active:scale-95 transition-transform"
            >
                <Menu size={28} />
            </button>
        </div>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
