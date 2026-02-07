import { Outlet } from 'react-router-dom';
import { ConnectionSidebar } from '@/components/dashboard/ConnectionSidebar';
import { ConnectionMobileNav } from '@/components/dashboard/ConnectionMobileNav';
import { TableTabsProvider } from '@/contexts/TableTabsContext';
import { QueryTabsProvider } from '@/contexts/QueryTabsContext';
import { ViewerExpiryBanner } from '@/components/dashboard/ViewerExpiryBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ConnectionLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <TableTabsProvider>
      <QueryTabsProvider>
        <div className="flex min-h-screen bg-[#1B2431] text-white font-sans selection:bg-[#3b82f6]/30">
          {/* Desktop Sidebar */}
          <div className="hidden md:block fixed left-0 top-0 h-full z-40">
            <ErrorBoundary level="widget">
              <ConnectionSidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />
            </ErrorBoundary>
          </div>

          {/* Mobile Navigation */}
          <ErrorBoundary level="widget">
            <ConnectionMobileNav />
          </ErrorBoundary>

          <main className={cn(
            "flex-1 overflow-auto relative min-h-screen transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "md:ml-14" : "md:ml-60",
            "ml-0"
          )}>
            <ErrorBoundary level="widget">
              <ViewerExpiryBanner />
            </ErrorBoundary>
            <div className="relative z-10 p-0 h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </QueryTabsProvider>
    </TableTabsProvider>
  );
}
