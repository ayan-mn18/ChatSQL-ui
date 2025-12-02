import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#1B2431] text-white font-sans selection:bg-[#6366f1]/30">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto relative min-h-screen">
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
