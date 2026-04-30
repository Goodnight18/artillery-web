"use client";
import React, { useState, useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import Sidebar from './dashboard/Sidebar';
import Header from './dashboard/Header';
import { usePresence } from "@/hooks/usePresence";

function AppContent({ children }: { children: React.ReactNode }) {
  usePresence();
  return <>{children}</>;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-slate-50 relative">
          <AppContent>{children}</AppContent>
        </main>
      </div>
    </div>
  );
}
