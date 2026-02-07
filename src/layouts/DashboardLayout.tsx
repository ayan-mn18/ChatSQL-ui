import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans selection:bg-[#6366f1]/30">
      <ErrorBoundary level="widget">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </ErrorBoundary>
      <ErrorBoundary level="widget">
        <MobileNav />
      </ErrorBoundary>
      <main
        className={cn(
          "flex-1 overflow-auto relative min-h-screen transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64",
          "ml-0" // Mobile
        )}
      >
        <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
