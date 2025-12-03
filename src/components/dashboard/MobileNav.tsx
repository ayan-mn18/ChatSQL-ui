import { NavLink } from 'react-router-dom';
import { Database, Settings, BarChart3, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Database, label: 'Connections', href: '/dashboard/connections' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function MobileNav() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <div className="flex items-center gap-1 p-2 rounded-full bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "p-3 rounded-full transition-all duration-300 relative group",
                isActive
                  ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/25 scale-110"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {/* Tooltip-ish label */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0f172a] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
