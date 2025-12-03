import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConnectionSidebar } from '@/components/dashboard/ConnectionSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function ConnectionLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#1B2431] text-white font-sans selection:bg-[#3b82f6]/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full z-40">
        <ConnectionSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50 text-white hover:bg-white/10">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r border-white/10 bg-[#1B2431] text-white">
          <ConnectionSidebar onClose={() => setIsMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 md:ml-64 overflow-auto relative min-h-screen transition-all duration-300">
        <div className="relative z-10 p-0 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
