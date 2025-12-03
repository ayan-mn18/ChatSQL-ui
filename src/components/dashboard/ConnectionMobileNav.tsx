import { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { LayoutDashboard, Code, Network, Table, ChevronUp, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function ConnectionMobileNav() {
  const { id } = useParams();
  const [isTablesOpen, setIsTablesOpen] = useState(false);

  // Mock tables (should match Sidebar)
  const tables = ['users', 'orders', 'products', 'categories', 'reviews', 'audit_logs'];

  if (!id) return null;

  return (
    <>
      {/* Floating Bottom Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-md">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5">

          <NavLink
            to={`/dashboard/connection/${id}/overview`}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
              isActive ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
          </NavLink>

          <NavLink
            to={`/dashboard/connection/${id}/sql`}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
              isActive ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Code className="w-5 h-5" />
          </NavLink>

          {/* Center Action Button (Tables) */}
          <div className="relative -top-6">
            <Button
              size="icon"
              className={cn(
                "w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-4 border-[#1B2431] shadow-xl shadow-blue-500/30 transition-transform duration-300",
                isTablesOpen && "rotate-180"
              )}
              onClick={() => setIsTablesOpen(true)}
            >
              <Table className="w-6 h-6 text-white" />
            </Button>
          </div>

          <NavLink
            to={`/dashboard/connection/${id}/visualizer`}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
              isActive ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Network className="w-5 h-5" />
          </NavLink>

          <NavLink
            to={`/dashboard/connections`}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </NavLink>
        </div>
      </div>

      {/* Tables Sheet (Bottom Drawer) */}
      <Sheet open={isTablesOpen} onOpenChange={setIsTablesOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] bg-[#1B2431] border-white/10 p-0">
          <div className="flex flex-col h-full">
            <div className="p-6 pb-2">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold text-white mb-4">Database Tables</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search tables..."
                  className="h-10 pl-10 bg-[#273142] border-none text-white focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                {tables.map(table => (
                  <NavLink
                    key={table}
                    to={`/dashboard/connection/${id}/table/${table}`}
                    onClick={() => setIsTablesOpen(false)}
                    className={({ isActive }) => cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200",
                      isActive
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                        : "bg-[#273142] border-white/5 text-gray-400 hover:bg-[#323d52] hover:text-white"
                    )}
                  >
                    <Table className="w-6 h-6 mb-2 opacity-50" />
                    <span className="text-sm font-medium">{table}</span>
                  </NavLink>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
