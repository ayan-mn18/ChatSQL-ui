import { Outlet } from 'react-router-dom';
import { ConnectionSidebar } from '@/components/dashboard/ConnectionSidebar';
import { ConnectionMobileNav } from '@/components/dashboard/ConnectionMobileNav';
import { TableTabsProvider } from '@/contexts/TableTabsContext';
import { ViewerExpiryBanner } from '@/components/dashboard/ViewerExpiryBanner';

export default function ConnectionLayout() {
  return (
    <TableTabsProvider>
      <div className="flex min-h-screen bg-[#1B2431] text-white font-sans selection:bg-[#3b82f6]/30">
        {/* Desktop Sidebar */}
        <div className="hidden md:block fixed left-0 top-0 h-full z-40">
          <ConnectionSidebar />
        </div>

        {/* Mobile Navigation */}
        <ConnectionMobileNav />

        <main className="flex-1 md:ml-64 overflow-auto relative min-h-screen transition-all duration-300">
          <ViewerExpiryBanner />
          <div className="relative z-10 p-0 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </TableTabsProvider>
  );
}
