import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppNavbar } from '@/components/AppNavbar';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Inject feedback widget script on dashboard pages
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'http://localhost:7070/api/widget/embed.js?token=42d347a018afd7990940da6d8ce0654ff5cc861311402ff743554b0d7508704a';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      // Clean up any widget elements the script may have injected
      const widget = document.getElementById('feedback-widget-root');
      if (widget) widget.remove();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white font-sans selection:bg-[#6366f1]/30">
      <AppNavbar />
      <div className="flex flex-1 min-h-0">
        <ErrorBoundary level="widget">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        </ErrorBoundary>
        <ErrorBoundary level="widget">
          <MobileNav />
        </ErrorBoundary>
        <main
          className={cn(
            "flex-1 overflow-auto relative transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "md:ml-20" : "md:ml-64",
            "ml-0" // Mobile
          )}
        >
          <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
