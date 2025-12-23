import { Outlet } from 'react-router-dom';
import { ConnectionSidebar } from '@/components/dashboard/ConnectionSidebar';
import { ConnectionMobileNav } from '@/components/dashboard/ConnectionMobileNav';
import { TableTabsProvider } from '@/contexts/TableTabsContext';
import { QueryTabsProvider } from '@/contexts/QueryTabsContext';
import { ViewerExpiryBanner } from '@/components/dashboard/ViewerExpiryBanner';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ConnectionLayout() {
  const MIN_SIDEBAR_WIDTH = 240;
  const MAX_SIDEBAR_WIDTH = 420;
  const STORAGE_KEY = 'chatsql:connectionSidebarWidth';

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed)) {
      return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsed));
    }
    return 256;
  });

  const isResizingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX));
      setSidebarWidth(next);
    };

    const stop = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('mouseleave', stop);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('mouseleave', stop);
    };
  }, []);

  const cssVars = useMemo(
    () => ({
      ['--connection-sidebar-width' as any]: `${sidebarWidth}px`,
    }),
    [sidebarWidth]
  );

  return (
    <TableTabsProvider>
      <QueryTabsProvider>
        <div
          className="flex min-h-screen bg-[#1B2431] text-white font-sans selection:bg-[#3b82f6]/30"
          style={cssVars}
        >
          {/* Desktop Sidebar */}
          <div
            className="hidden md:block fixed left-0 top-0 h-full z-40"
            style={{ width: sidebarWidth }}
          >
            <div className="h-full relative">
              <ConnectionSidebar />

              {/* Resize handle */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sidebar"
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  isResizingRef.current = true;
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';
                }}
              />
            </div>
          </div>

          {/* Mobile Navigation */}
          <ConnectionMobileNav />

          <main className="flex-1 md:ml-[var(--connection-sidebar-width)] overflow-auto relative min-h-screen transition-all duration-300">
            <ViewerExpiryBanner />
            <div className="relative z-10 p-0 h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </QueryTabsProvider>
    </TableTabsProvider>
  );
}
