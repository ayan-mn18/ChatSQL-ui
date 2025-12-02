import { Outlet } from 'react-router-dom';
import { ConnectionSidebar } from '@/components/dashboard/ConnectionSidebar';

export default function ConnectionLayout() {
  return (
    <div className="flex min-h-screen bg-[#1B2431] text-white font-sans selection:bg-[#3b82f6]/30">
      <ConnectionSidebar />
      <main className="flex-1 ml-64 overflow-auto relative min-h-screen">
        <div className="relative z-10 p-0 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
